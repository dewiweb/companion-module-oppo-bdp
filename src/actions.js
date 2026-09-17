import { SIMPLE_COMMANDS, PARAMETERIZED_COMMANDS, NUMERIC_KEYS } from './commands.js'

export default function (self) {
	const actions = {}

	// Simple no-parameter remote commands
	for (const [id, def] of Object.entries(SIMPLE_COMMANDS)) {
		actions[id] = {
			name: def.name,
			options: [],
			callback: async () => {
				await self.sendCommand(def.cmd)
			},
		}
	}

	// Numeric keys 0-9
	actions.numeric_key = {
		name: 'Numeric key',
		options: [
			{
				id: 'key',
				type: 'dropdown',
				label: 'Key',
				default: 'NU0',
				choices: NUMERIC_KEYS,
			},
		],
		callback: async (event) => {
			await self.sendCommand(event.options.key)
		},
	}

	// Input selection via the on-screen list: direct `SIS` is ignored over IP
	// on some firmwares (e.g. BDP-105D); SRC opens the list then NU1-NU8 picks.
	actions.input_select = {
		name: 'Input: Select via on-screen list',
		description:
			'Opens the input list (SRC) then selects an entry by number. Use this when direct SIS gets no response. List order may vary by unit.',
		options: [
			{
				id: 'position',
				type: 'dropdown',
				label: 'Input list position',
				default: 'NU1',
				choices: [
					{ id: 'NU1', label: '1 - Blu-ray player' },
					{ id: 'NU2', label: '2 - HDMI/MHL In (front)' },
					{ id: 'NU3', label: '3 - HDMI In (back)' },
					{ id: 'NU4', label: '4 - ARC HDMI Out 1' },
					{ id: 'NU5', label: '5 - ARC HDMI Out 2' },
					{ id: 'NU6', label: '6 - Optical In' },
					{ id: 'NU7', label: '7 - Coaxial In' },
					{ id: 'NU8', label: '8 - USB Audio In' },
				],
			},
			{
				id: 'delay',
				type: 'number',
				label: 'Menu open delay (ms)',
				default: 1000,
				min: 200,
				max: 5000,
			},
		],
		callback: async (event) => {
			await self.sendCommand('SRC')
			await new Promise((r) => setTimeout(r, event.options.delay))
			await self.sendCommand(event.options.position)
		},
	}

	// Parameterized commands
	for (const [id, def] of Object.entries(PARAMETERIZED_COMMANDS)) {
		actions[id] = {
			name: def.name,
			description:
				'Set-commands are ignored over the IP interface on some firmwares (e.g. BDP-105D) — they will silently time out there.',
			options: def.options,
			callback: async (event) => {
				const args = []
				for (const opt of def.options) {
					args.push(event.options[opt.id])
				}
				await self.sendCommand(`${def.cmd} ${args.join(' ')}`)
			},
		}
	}

	// Escape hatch for anything not covered above
	actions.raw_command = {
		name: 'Send raw command',
		options: [
			{
				id: 'command',
				type: 'textinput',
				label: 'Command (e.g. "QPW" or "SVL 50", no REMOTE prefix)',
				default: '',
				regex: '/^[A-Z0-9]{3}( [^#@\\r]*)?$/',
				useVariables: true,
			},
		],
		callback: async (event) => {
			const cmd = String(event.options.command).trim().toUpperCase()
			if (cmd) await self.sendCommand(cmd)
		},
	}

	self.setActionDefinitions(actions)
}
