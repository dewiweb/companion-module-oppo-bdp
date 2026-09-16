import { combineRgb } from '@companion-module/base'
import { INPUT_SOURCES, DISC_TYPES, PLAYBACK_STATES, REPEAT_MODES } from './commands.js'

export default function (self) {
	const GREEN = combineRgb(0, 128, 0)
	const RED = combineRgb(180, 0, 0)
	const BLUE = combineRgb(0, 0, 180)
	const ORANGE = combineRgb(200, 100, 0)

	self.setFeedbackDefinitions({
		power_state: {
			name: 'Power state',
			type: 'boolean',
			description: 'Player power state',
			defaultStyle: {
				bgcolor: GREEN,
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'On' },
						{ id: 'standby', label: 'Standby' },
						{ id: 'unknown', label: 'Unknown' },
					],
				},
			],
			callback: (feedback) => self.state.power === feedback.options.state,
		},
		playback_state: {
			name: 'Playback status',
			type: 'boolean',
			description: 'Current playback status (play, pause, stop, menus...)',
			defaultStyle: {
				bgcolor: GREEN,
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'Status',
					default: 'PLAY',
					choices: PLAYBACK_STATES.map((s) => ({ id: s, label: s })),
				},
			],
			callback: (feedback) => self.state.playback_status === feedback.options.state,
		},
		disc_type: {
			name: 'Disc type',
			type: 'boolean',
			description: 'Type of disc currently loaded',
			defaultStyle: {
				bgcolor: BLUE,
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'type',
					type: 'dropdown',
					label: 'Disc type',
					default: 'BD-MV',
					choices: DISC_TYPES.map((t) => ({ id: t, label: t })),
				},
			],
			callback: (feedback) => self.state.disc_type === feedback.options.type,
		},
		input_source: {
			name: 'Input source',
			type: 'boolean',
			description: 'Currently selected input source',
			defaultStyle: {
				bgcolor: ORANGE,
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'source',
					type: 'dropdown',
					label: 'Input source',
					default: 'BD-PLAYER',
					choices: Object.values(INPUT_SOURCES).map((s) => ({ id: s, label: s })),
				},
			],
			callback: (feedback) => self.state.input_source === feedback.options.source,
		},
		muted: {
			name: 'Audio muted',
			type: 'boolean',
			description: 'Audio output is muted',
			defaultStyle: {
				bgcolor: RED,
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.state.muted === true,
		},
		repeat_mode: {
			name: 'Repeat mode',
			type: 'boolean',
			description: 'Current repeat mode',
			defaultStyle: {
				bgcolor: BLUE,
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Repeat mode',
					default: '00 Off',
					choices: REPEAT_MODES.map((m) => ({ id: m, label: m })),
				},
			],
			callback: (feedback) => self.state.repeat_mode === feedback.options.mode,
		},
	})
}
