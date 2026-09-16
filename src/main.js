import { InstanceBase, Regex, InstanceStatus, TCPHelper } from '@companion-module/base'
import { UpgradeScripts } from './upgrades.js'
import UpdateActions from './actions.js'
import UpdateFeedbacks from './feedbacks.js'
import UpdateVariableDefinitions from './variables.js'
import UpdatePresets from './presets.js'
import { QUERIES, POLL_ON_QUERIES, POLL_OFF_QUERIES, INIT_QUERIES, UPL_STATES, UDT_DISC_TYPES } from './commands.js'

export { UpgradeScripts }

const RESPONSE_TIMEOUT = 5000 // ms to wait for a command response
const COMMAND_GAP = 100 // ms between commands; the player handles one at a time
const MAX_RETRIES = 1 // retry once on 'ER OVERTIME'

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.socket = undefined
		this.config = {}
		this.receiveBuffer = ''
		this.commandQueue = [] // pending { cmd, resolve, retried }
		this.sending = false
		this.pendingItem = undefined
		this.pendingTimer = undefined
		this.pollTimer = undefined
		this.state = {}
	}

	async init(config) {
		this.config = config
		this.initState()
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updatePresetDefinitions()
		this.initConnection()
	}

	async destroy() {
		this.stopPolling()
		if (this.pendingTimer) clearTimeout(this.pendingTimer)
		if (this.socket) {
			this.socket.destroy()
			this.socket = undefined
		}
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		const reconnect = config.host !== this.config.host || config.port !== this.config.port
		this.config = config
		this.startPolling()
		if (reconnect) this.initConnection()
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'Default port: 48360 (BDP-93/95/103/105), 19999 (BDP-83). The player must have network control enabled.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 8,
				regex: Regex.IP,
				required: true,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				width: 4,
				regex: Regex.PORT,
				default: '48360',
				required: true,
			},
			{
				type: 'number',
				id: 'poll_interval',
				label: 'Poll interval (seconds)',
				width: 4,
				default: 5,
				min: 2,
				max: 120,
			},
		]
	}

	initState() {
		this.state = {
			power: 'unknown',
			playback_status: 'unknown',
			disc_type: 'unknown',
			volume: '',
			muted: false,
			input_source: 'unknown',
			track: '',
			chapter: '',
			time_track_elapsed: '',
			time_track_remaining: '',
			time_chapter_elapsed: '',
			time_chapter_remaining: '',
			time_total_elapsed: '',
			time_total_remaining: '',
			audio_type: '',
			subtitle_type: '',
			subtitle_shift: '',
			osd_position: '',
			repeat_mode: '',
			zoom_mode: '',
			hdmi_resolution: '',
			firmware_version: '',
			time_code: '',
			time_code_type: '',
		}
	}

	// ------------------------------------------------------------------
	// Connection
	// ------------------------------------------------------------------

	initConnection() {
		this.stopPolling()
		this.flushQueue()
		this.receiveBuffer = ''
		this.sending = false

		if (this.socket) {
			this.socket.destroy()
			this.socket = undefined
		}

		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig)
			return
		}

		const port = parseInt(this.config.port, 10) || 48360
		this.socket = new TCPHelper(this.config.host, port, { reconnect: true, reconnect_interval: 5000 })

		this.socket.on('status_change', (status, message) => {
			this.updateStatus(status, message)
		})

		this.socket.on('error', (err) => {
			this.log('error', `Network error: ${err.message}`)
		})

		this.socket.on('connect', () => {
			this.log('info', `Connected to ${this.config.host}:${port}`)
			this.receiveBuffer = ''
			this.detectPowerState()
			this.startPolling()
		})

		this.socket.on('end', () => {
			this.log('debug', 'Connection ended by player')
			this.flushQueue()
		})

		this.socket.on('data', (data) => {
			this.onData(data)
		})
	}

	// ------------------------------------------------------------------
	// Command queue / wire protocol
	// ------------------------------------------------------------------

	// Send a command and resolve with the response payload (e.g. 'OK ON'),
	// 'ER ...' on device error, or null on timeout/disconnect.
	sendCommand(cmd, timeout = RESPONSE_TIMEOUT) {
		return new Promise((resolve) => {
			this.commandQueue.push({ cmd, resolve, retried: 0, timeout })
			this.processQueue()
		})
	}

	processQueue() {
		if (this.sending) return
		const item = this.commandQueue.shift()
		if (!item) return
		if (!this.socket || !this.socket.isConnected) {
			item.resolve(null)
			this.processQueue()
			return
		}

		this.sending = true
		this.pendingItem = item

		this.socket.sendAsync(`REMOTE ${item.cmd}`).catch((err) => {
			this.log('debug', `Send failed for ${item.cmd}: ${err.message}`)
			this.resolvePending(null)
		})

		this.pendingTimer = setTimeout(() => {
			this.log('debug', `No response to ${item.cmd}`)
			this.resolvePending(null)
		}, item.timeout)
	}

	resolvePending(payload) {
		const item = this.pendingItem
		this.pendingItem = undefined
		if (this.pendingTimer) {
			clearTimeout(this.pendingTimer)
			this.pendingTimer = undefined
		}
		if (item) item.resolve(payload)
		// Small gap before the next command; the player processes serially.
		setTimeout(() => {
			this.sending = false
			this.processQueue()
		}, COMMAND_GAP)
	}

	flushQueue() {
		const item = this.pendingItem
		this.pendingItem = undefined
		if (this.pendingTimer) {
			clearTimeout(this.pendingTimer)
			this.pendingTimer = undefined
		}
		if (item) item.resolve(null)
		while (this.commandQueue.length) {
			this.commandQueue.shift().resolve(null)
		}
	}

	onData(data) {
		this.receiveBuffer += data.toString('latin1')
		const frames = this.receiveBuffer.split('\r')
		this.receiveBuffer = frames.pop() || ''
		for (const frame of frames) {
			const line = frame.trim()
			if (line) this.handleFrame(line)
		}
	}

	handleFrame(line) {
		// Expected: '@<CODE> <payload>' (verbose >= 1), '@<payload>' (verbose 0).
		if (line[0] !== '@') {
			this.log('debug', `Ignoring non-response frame: ${line}`)
			return
		}
		const body = line.slice(1)
		let code = ''
		let payload = body
		const m = body.match(/^([A-Z0-9]{3})\s+(.*)$/s)
		if (m) {
			code = m[1]
			payload = m[2]
		}

		// Unsolicited status updates all use 'Uxx' codes; no command code starts with 'U'.
		if (code[0] === 'U') {
			this.handleUpdate(code, payload)
			return
		}

		// Command response. 'ER OVERTIME' means the player was busy: retry once.
		if (payload === 'ER OVERTIME' && this.pendingItem && this.pendingItem.retried < MAX_RETRIES) {
			const item = this.pendingItem
			this.log('debug', `OVERTIME response, retrying ${item.cmd}`)
			item.retried++
			this.pendingItem = undefined
			if (this.pendingTimer) {
				clearTimeout(this.pendingTimer)
				this.pendingTimer = undefined
			}
			this.commandQueue.unshift(item)
			this.sending = false
			this.processQueue()
			return
		}
		this.log('debug', `Response ${code ? `${code} ` : ''}: ${payload}`)
		this.resolvePending(payload)
		this.handleCommandResponse(code, payload)
	}

	// ------------------------------------------------------------------
	// State / polling
	// ------------------------------------------------------------------

	async detectPowerState() {
		const payload = await this.sendCommand('QPW')
		if (payload === 'OK ON') {
			await this.onPoweredOn()
		} else if (payload === 'OK OFF') {
			this.setPower('standby')
		}
	}

	async onPoweredOn() {
		const firstOn = this.state.power !== 'on'
		this.setPower('on')
		if (firstOn) {
			// Best-effort: try enabling detailed unsolicited updates. On some
			// firmwares (e.g. BDP-105D 10XEU) SVM over IP gets no response and
			// QVM stays 0 — hence the short timeout. Polling still covers state.
			await this.sendCommand('SVM 3', 1000)
			for (const q of INIT_QUERIES) {
				await this.query(q)
			}
		}
	}

	async query(code) {
		const payload = await this.sendCommand(code)
		if (payload && payload.startsWith('OK')) {
			this.applyQuery(code, payload.slice(2).trim())
		}
	}

	applyQuery(code, value) {
		const def = QUERIES[code]
		if (!def) return
		switch (code) {
			case 'QPW':
				if (value === 'ON') {
					if (this.state.power !== 'on') this.onPoweredOn()
					else this.setPower('on')
				} else {
					this.setPower('standby')
				}
				return
			case 'QVL':
				this.setState('volume', value === 'MUTE' ? '0' : value)
				this.setState('muted', value === 'MUTE')
				return
			case 'QIS': {
				const m = value.match(/^(\d)\s+(.*)$/)
				this.setState('input_source', m ? m[2] : value)
				return
			}
			case 'QPL':
				this.setState('playback_status', value)
				return
			default:
				this.setState(def.variable, value)
		}
	}

	setPower(power) {
		if (this.state.power === power) return
		this.setState('power', power)
		if (power === 'standby') {
			this.setState('playback_status', 'standby')
		}
	}

	setState(key, value) {
		if (this.state[key] === value) return
		this.state[key] = value
		this.setVariableValues({ [key]: value })
		this.checkFeedbacks('power_state', 'playback_state', 'disc_type', 'input_source', 'muted', 'repeat_mode')
	}

	startPolling() {
		this.stopPolling()
		const interval = Math.max(2, parseInt(this.config.poll_interval, 10) || 5) * 1000
		this.pollTimer = setInterval(() => this.poll(), interval)
	}

	stopPolling() {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = undefined
		}
	}

	async poll() {
		if (!this.socket || !this.socket.isConnected) return
		const queries = this.state.power === 'on' ? POLL_ON_QUERIES : POLL_OFF_QUERIES
		for (const q of queries) {
			await this.query(q)
		}
	}

	// ------------------------------------------------------------------
	// Unsolicited verbose-mode updates (@Uxx ...)
	// ------------------------------------------------------------------

	handleUpdate(code, payload) {
		this.log('debug', `Update ${code}: ${payload}`)
		switch (code) {
			case 'UPW':
				if (payload === '1') {
					this.onPoweredOn()
				} else {
					this.setPower('standby')
				}
				break
			case 'UPL':
				this.setState('playback_status', UPL_STATES[payload] || payload)
				break
			case 'UVL':
				if (payload === 'MUT') {
					this.setState('muted', true)
				} else {
					this.setState('volume', String(parseInt(payload, 10)))
					this.setState('muted', false)
				}
				break
			case 'UDT':
				this.setState('disc_type', UDT_DISC_TYPES[payload] || payload)
				break
			case 'UAT':
				this.setState('audio_type', payload)
				break
			case 'UST':
				this.setState('subtitle_type', payload === '00/00' || payload.startsWith('00/') ? 'OFF' : payload)
				break
			case 'UIS': {
				const m = payload.match(/^(\d)\s+(.*)$/)
				this.setState('input_source', m ? m[2] : payload)
				break
			}
			case 'UTC': {
				// @UTC <title> <chapter> <type> <HH:MM:SS>
				const parts = payload.split(/\s+/)
				if (parts.length >= 4) {
					this.setState('track', parts[0])
					this.setState('chapter', parts[1])
					this.setState('time_code_type', parts[2])
					this.setState('time_code', parts[3])
				}
				break
			}
			case 'UVO': {
				const parts = payload.split(/\s+/)
				if (parts.length >= 2) this.setState('hdmi_resolution', parts[1])
				break
			}
		}
	}

	handleCommandResponse(code, payload) {
		// Keep state fresh for commands that carry their result in the response.
		if (!payload || !payload.startsWith('OK')) return
		const value = payload.slice(2).trim()
		switch (code) {
			case 'POW':
			case 'PON':
			case 'POF':
				this.setPower(value === 'ON' ? 'on' : 'standby')
				break
			case 'MUT':
				this.setState('muted', value === 'MUTE')
				break
			case 'VUP':
			case 'VDN':
			case 'SVL':
				this.setState('volume', value === 'MUTE' ? '0' : value)
				this.setState('muted', value === 'MUTE')
				break
			case 'QIS':
			case 'SIS': {
				const m = value.match(/^(\d)\s+(.*)$/)
				this.setState('input_source', m ? m[2] : value)
				break
			}
			case 'QRP':
			case 'SRP':
				this.setState('repeat_mode', value)
				break
		}
	}

	// ------------------------------------------------------------------
	// Companion registrations
	// ------------------------------------------------------------------

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

	updatePresetDefinitions() {
		UpdatePresets(this)
	}
}

export default ModuleInstance
