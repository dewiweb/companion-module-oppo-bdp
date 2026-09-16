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

	// Parameterized commands
	for (const [id, def] of Object.entries(PARAMETERIZED_COMMANDS)) {
		actions[id] = {
			name: def.name,
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
