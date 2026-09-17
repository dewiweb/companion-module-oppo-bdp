import { combineRgb } from '@companion-module/base'

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const DARK = combineRgb(40, 40, 40)
const GREEN = combineRgb(0, 100, 0)
const ORANGE = combineRgb(160, 80, 0)
const RED = combineRgb(150, 0, 0)

function preset(name, actionId, options = {}, feedbacks = [], style = {}, category) {
	return {
		category,
		def: {
			type: 'simple',
			name,
			style: {
				text: name,
				size: 'auto',
				color: WHITE,
				bgcolor: DARK,
				...style,
			},
			steps: [{ down: [{ actionId, options }], up: [] }],
			feedbacks,
		},
	}
}

const powerFeedback = {
	feedbackId: 'power_state',
	options: { state: 'on' },
	style: { bgcolor: GREEN },
}

const playbackFeedback = (state) => ({
	feedbackId: 'playback_state',
	options: { state },
	style: { bgcolor: GREEN },
})

const inputFeedback = (source) => ({
	feedbackId: 'input_source',
	options: { source },
	style: { bgcolor: ORANGE },
})

export default function (self) {
	const presets = {}
	const structure = []

	const add = (sectionId, id, p) => {
		presets[id] = p.def
		structure.find((s) => s.id === sectionId).definitions.push(id)
	}

	structure.push(
		{ id: 'power', name: 'Power', definitions: [] },
		{ id: 'transport', name: 'Playback / Transport', definitions: [] },
		{ id: 'navigation', name: 'Navigation & Menus', definitions: [] },
		{ id: 'volume', name: 'Volume', definitions: [] },
		{ id: 'numeric', name: 'Numeric keys', definitions: [] },
		{ id: 'inputs', name: 'Input sources', definitions: [] },
		{ id: 'status', name: 'Status', definitions: [] },
	)

	add('power', 'power_toggle', preset('Power toggle', 'power_toggle', {}, [powerFeedback], {}, 'Power'))
	add('power', 'power_on', preset('Power on', 'power_on', {}, [], {}, 'Power'))
	add('power', 'power_off', preset('Power off', 'power_off', {}, [], {}, 'Power'))

	add('transport', 'play', preset('\u25B6 Play', 'play', {}, [playbackFeedback('PLAY')], {}, 'Transport'))
	add('transport', 'pause', preset('\u23F8 Pause', 'pause', {}, [playbackFeedback('PAUSE')], {}, 'Transport'))
	add('transport', 'stop', preset('\u23F9 Stop', 'stop', {}, [playbackFeedback('STOP')], {}, 'Transport'))
	add('transport', 'previous', preset('\u23EE Prev', 'previous', {}, [], {}, 'Transport'))
	add('transport', 'next', preset('\u23EF Next', 'next', {}, [], {}, 'Transport'))
	add(
		'transport',
		'fast_reverse',
		preset('\u23EA FREV', 'fast_reverse', {}, [playbackFeedback('FREV')], {}, 'Transport'),
	)
	add(
		'transport',
		'fast_forward',
		preset('\u23E9 FFWD', 'fast_forward', {}, [playbackFeedback('FFWD')], {}, 'Transport'),
	)
	add('transport', 'tray', preset('Eject', 'tray_toggle', {}, [], {}, 'Transport'))

	add('navigation', 'nav_up', preset('\u25B2', 'nav_up', {}, [], {}, 'Navigation'))
	add('navigation', 'nav_down', preset('\u25BC', 'nav_down', {}, [], {}, 'Navigation'))
	add('navigation', 'nav_left', preset('\u25C0', 'nav_left', {}, [], {}, 'Navigation'))
	add('navigation', 'nav_right', preset('\u25B6', 'nav_right', {}, [], {}, 'Navigation'))
	add('navigation', 'nav_enter', preset('Enter', 'nav_enter', {}, [], { bgcolor: GREEN }, 'Navigation'))
	add('navigation', 'nav_return', preset('Return', 'nav_return', {}, [], {}, 'Navigation'))
	add('navigation', 'home_menu', preset('Home', 'home_menu', {}, [], {}, 'Navigation'))
	add('navigation', 'top_menu', preset('Top menu', 'top_menu', {}, [], {}, 'Navigation'))
	add('navigation', 'popup_menu', preset('Popup menu', 'popup_menu', {}, [], {}, 'Navigation'))
	add('navigation', 'setup_menu', preset('Setup', 'setup_menu', {}, [], {}, 'Navigation'))
	add('navigation', 'osd', preset('OSD', 'osd_toggle', {}, [], {}, 'Navigation'))

	add('volume', 'volume_up', preset('Vol +', 'volume_up', {}, [], {}, 'Volume'))
	add('volume', 'volume_down', preset('Vol -', 'volume_down', {}, [], {}, 'Volume'))
	add(
		'volume',
		'mute',
		preset('Mute', 'mute_toggle', {}, [{ feedbackId: 'muted', options: {}, style: { bgcolor: RED } }], {}, 'Volume'),
	)

	for (let i = 0; i <= 9; i++) {
		add('numeric', `num_${i}`, preset(String(i), 'numeric_key', { key: `NU${i}` }, [], {}, 'Numeric'))
	}

	add(
		'inputs',
		'input_bd',
		preset('BD player', 'input_select', { position: 'NU1' }, [inputFeedback('BD-PLAYER')], {}, 'Inputs'),
	)
	add(
		'inputs',
		'input_hdmi_front',
		preset('HDMI front', 'input_select', { position: 'NU2' }, [inputFeedback('HDMI-FRONT')], {}, 'Inputs'),
	)
	add(
		'inputs',
		'input_hdmi_back',
		preset('HDMI back', 'input_select', { position: 'NU3' }, [inputFeedback('HDMI-BACK')], {}, 'Inputs'),
	)
	add(
		'inputs',
		'input_arc1',
		preset('ARC HDMI out 1', 'input_select', { position: 'NU4' }, [inputFeedback('ARC-HDMI-OUT1')], {}, 'Inputs'),
	)
	add(
		'inputs',
		'input_arc2',
		preset('ARC HDMI out 2', 'input_select', { position: 'NU5' }, [inputFeedback('ARC-HDMI-OUT2')], {}, 'Inputs'),
	)
	add(
		'inputs',
		'input_optical',
		preset('Optical', 'input_select', { position: 'NU6' }, [inputFeedback('OPTICAL')], {}, 'Inputs'),
	)
	add(
		'inputs',
		'input_coaxial',
		preset('Coaxial', 'input_select', { position: 'NU7' }, [inputFeedback('COAXIAL')], {}, 'Inputs'),
	)
	add(
		'inputs',
		'input_usb',
		preset('USB audio', 'input_select', { position: 'NU8' }, [inputFeedback('USB-AUDIO')], {}, 'Inputs'),
	)

	presets.status = {
		type: 'simple',
		name: 'Playback status display',
		style: {
			text: '$(oppo-bdp:playback_status)\n$(oppo-bdp:time_total_elapsed) / $(oppo-bdp:time_total_remaining)',
			size: 'auto',
			color: WHITE,
			bgcolor: BLACK,
		},
		steps: [{ down: [], up: [] }],
		feedbacks: [{ feedbackId: 'playback_state', options: { state: 'PLAY' }, style: { bgcolor: GREEN } }],
	}
	structure.find((s) => s.id === 'status').definitions.push('status')

	self.setPresetDefinitions(structure, presets)
}
