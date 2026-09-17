// OPPO BDP command set (RS-232 protocol v1.1 codes, sent over IP as `REMOTE <CODE>`).
// Simple commands take no parameters; their response is `@<CODE> OK ...` or `@<CODE> ER ...`.

const SIMPLE_COMMANDS = {
	// Power
	power_toggle: { name: 'Power: Toggle', cmd: 'POW' },
	power_on: { name: 'Power: On (discrete)', cmd: 'PON' },
	power_off: { name: 'Power: Off (discrete)', cmd: 'POF' },

	// Transport
	play: { name: 'Playback: Play', cmd: 'PLA' },
	pause: { name: 'Playback: Pause', cmd: 'PAU' },
	stop: { name: 'Playback: Stop', cmd: 'STP' },
	previous: { name: 'Playback: Previous chapter/track', cmd: 'PRE' },
	next: { name: 'Playback: Next chapter/track', cmd: 'NXT' },
	fast_forward: { name: 'Playback: Fast forward', cmd: 'FWD' },
	fast_reverse: { name: 'Playback: Fast reverse', cmd: 'REV' },
	direct_play: { name: 'Playback: Direct play', cmd: 'DPL' },

	// Tray / disc
	tray_toggle: { name: 'Disc tray: Open/Close', cmd: 'EJT' },
	goto: { name: 'Playback: GOTO (play from specified location)', cmd: 'GOT' },

	// Navigation
	nav_up: { name: 'Navigation: Up', cmd: 'NUP' },
	nav_down: { name: 'Navigation: Down', cmd: 'NDN' },
	nav_left: { name: 'Navigation: Left', cmd: 'NLT' },
	nav_right: { name: 'Navigation: Right', cmd: 'NRT' },
	nav_enter: { name: 'Navigation: Enter', cmd: 'SEL' },
	nav_return: { name: 'Navigation: Return', cmd: 'RET' },
	page_up: { name: 'Navigation: Page up', cmd: 'PUP' },
	page_down: { name: 'Navigation: Page down', cmd: 'PDN' },
	clear: { name: 'Numeric: Clear input', cmd: 'CLR' },

	// Menus
	home_menu: { name: 'Menu: Home', cmd: 'HOM' },
	top_menu: { name: 'Menu: Top menu / DVD title', cmd: 'TTL' },
	popup_menu: { name: 'Menu: Pop-up / DVD menu', cmd: 'MNU' },
	setup_menu: { name: 'Menu: Setup', cmd: 'SET' },
	osd_toggle: { name: 'Menu: On-screen display toggle', cmd: 'OSD' },
	option_menu: { name: 'Menu: Option menu', cmd: 'OPT' },
	menu_3d: { name: 'Menu: 3D conversion/adjustment', cmd: 'M3D' },
	picture_adjustment: { name: 'Menu: Picture adjustment', cmd: 'SEH' },

	// Audio / video controls
	volume_up: { name: 'Volume: Up', cmd: 'VUP' },
	volume_down: { name: 'Volume: Down', cmd: 'VDN' },
	mute_toggle: { name: 'Volume: Mute toggle', cmd: 'MUT' },
	audio_language: { name: 'Audio: Language/channel', cmd: 'AUD' },
	subtitle_language: { name: 'Subtitle: Language', cmd: 'SUB' },
	subtitle_hold: { name: 'Subtitle: Shift activate (hold)', cmd: 'SUH' },
	angle: { name: 'Video: Camera angle', cmd: 'ANG' },
	zoom_button: { name: 'Video: Zoom in/out (button)', cmd: 'ZOM' },
	sap_toggle: { name: 'Audio: Secondary audio program', cmd: 'SAP' },
	resolution_button: { name: 'Video: Resolution (button)', cmd: 'HDM' },
	tv_system_cycle: { name: 'Video: TV system cycle (P/N)', cmd: 'SYS' },
	dimmer: { name: 'Front panel: Dimmer', cmd: 'DIM' },
	pure_audio: { name: 'Audio: Pure audio mode', cmd: 'PUR' },
	pip_toggle: { name: 'Video: Picture-in-picture toggle', cmd: 'PIP' },

	// Input / apps
	input_button: { name: 'Input: INPUT button (open list)', cmd: 'SRC' },
	launch_netflix: { name: 'Apps: Launch Netflix', cmd: 'NFX' },
	launch_vudu: { name: 'Apps: Launch VUDU', cmd: 'VDU' },

	// Colour keys
	color_red: { name: 'Colour key: Red', cmd: 'RED' },
	color_green: { name: 'Colour key: Green', cmd: 'GRN' },
	color_blue: { name: 'Colour key: Blue', cmd: 'BLU' },
	color_yellow: { name: 'Colour key: Yellow', cmd: 'YLW' },

	// Repeat
	repeat_button: { name: 'Repeat: Cycle (button)', cmd: 'RPT' },
	ab_repeat: { name: 'Repeat: A-B repeat', cmd: 'ATB' },

	// Misc
	no_operation: { name: 'Misc: No operation (NOP)', cmd: 'NOP' },
	reset_buffer: { name: 'Misc: Reset command buffer', cmd: 'RST' },
}

const NUMERIC_KEYS = [
	{ id: 'NU0', label: '0' },
	{ id: 'NU1', label: '1' },
	{ id: 'NU2', label: '2' },
	{ id: 'NU3', label: '3' },
	{ id: 'NU4', label: '4' },
	{ id: 'NU5', label: '5' },
	{ id: 'NU6', label: '6' },
	{ id: 'NU7', label: '7' },
	{ id: 'NU8', label: '8' },
	{ id: 'NU9', label: '9' },
]

// Parameterized commands (advanced set/query commands).
const PARAMETERIZED_COMMANDS = {
	set_volume: {
		name: 'Volume: Set level',
		cmd: 'SVL',
		options: [
			{
				id: 'level',
				type: 'textinput',
				label: 'Level (0-100 or MUTE)',
				default: '50',
				regex: '/^(?:\\d{1,3}|MUTE)$/i',
				useVariables: true,
			},
		],
	},
	set_hdmi_resolution: {
		name: 'Video: Set HDMI resolution',
		cmd: 'SHD',
		options: [
			{
				id: 'resolution',
				type: 'dropdown',
				label: 'Resolution',
				default: 'AUTO',
				choices: [
					{ id: 'SDI', label: 'SD interlaced (480i/576i)' },
					{ id: 'SDP', label: 'SD progressive (480p/576p)' },
					{ id: '720P', label: '720p' },
					{ id: '1080I', label: '1080i' },
					{ id: '1080P', label: '1080p' },
					{ id: 'SRC', label: 'Source direct' },
					{ id: 'AUTO', label: 'Auto' },
				],
			},
		],
	},
	set_tv_system: {
		name: 'Video: Set TV system',
		cmd: 'SPN',
		options: [
			{
				id: 'system',
				type: 'dropdown',
				label: 'TV system',
				default: 'AUTO',
				choices: [
					{ id: 'NTSC', label: 'NTSC' },
					{ id: 'PAL', label: 'PAL' },
					{ id: 'AUTO', label: 'Auto (multi)' },
				],
			},
		],
	},
	set_zoom_ratio: {
		name: 'Video: Set zoom ratio',
		cmd: 'SZM',
		options: [
			{
				id: 'ratio',
				type: 'dropdown',
				label: 'Zoom ratio',
				default: '1',
				choices: [
					{ id: '1', label: 'Off (1x)' },
					{ id: 'AR', label: 'Aspect-ratio correction' },
					{ id: 'FS', label: 'Full screen' },
					{ id: 'US', label: 'Underscan' },
					{ id: '1.2', label: '1.2x' },
					{ id: '1.3', label: '1.3x' },
					{ id: '1.5', label: '1.5x' },
					{ id: '2', label: '2x' },
					{ id: '3', label: '3x' },
					{ id: '4', label: '4x' },
					{ id: '1/2', label: '1/2' },
					{ id: '1/3', label: '1/3' },
					{ id: '1/4', label: '1/4' },
				],
			},
		],
	},
	set_repeat_mode: {
		name: 'Repeat: Set mode',
		cmd: 'SRP',
		options: [
			{
				id: 'mode',
				type: 'dropdown',
				label: 'Repeat mode',
				default: 'OFF',
				choices: [
					{ id: 'OFF', label: 'Off' },
					{ id: 'CH', label: 'Chapter' },
					{ id: 'TT', label: 'Title / CD track' },
					{ id: 'ALL', label: 'All' },
					{ id: 'SHF', label: 'Shuffle' },
					{ id: 'RND', label: 'Random' },
				],
			},
		],
	},
	search_to_position: {
		name: 'Playback: Search to position',
		cmd: 'SRH',
		options: [
			{
				id: 'target',
				type: 'textinput',
				label: 'Target (e.g. T3, C10, 0:12:13, T 0:12:13)',
				default: '0:00:00',
				regex: '/^[TtCc]? ?\\d{1,2}(:\\d{1,2}){0,2}$|^[TtCc]\\d+$/',
				useVariables: true,
			},
		],
	},
	set_subtitle_shift: {
		name: 'Subtitle: Set shift',
		cmd: 'SSH',
		options: [
			{
				id: 'shift',
				type: 'number',
				label: 'Shift (-5 to 5)',
				default: 0,
				min: -5,
				max: 5,
			},
		],
	},
	set_osd_position: {
		name: 'Menu: Set OSD position',
		cmd: 'SOP',
		options: [
			{
				id: 'position',
				type: 'number',
				label: 'Position (0-5)',
				default: 0,
				min: 0,
				max: 5,
			},
		],
	},
	set_time_display: {
		name: 'Front panel: Set time display',
		cmd: 'STC',
		options: [
			{
				id: 'code',
				type: 'dropdown',
				label: 'Time display',
				default: 'E',
				choices: [
					{ id: 'E', label: 'Total elapsed' },
					{ id: 'R', label: 'Total remaining' },
					{ id: 'T', label: 'Title elapsed' },
					{ id: 'X', label: 'Title remaining' },
					{ id: 'C', label: 'Chapter/track elapsed' },
					{ id: 'K', label: 'Chapter/track remaining' },
				],
			},
		],
	},
	set_input_source: {
		name: 'Input: Set source',
		cmd: 'SIS',
		options: [
			{
				id: 'source',
				type: 'dropdown',
				label: 'Input source',
				default: '0',
				choices: [
					{ id: '0', label: 'Blu-ray player' },
					{ id: '1', label: 'HDMI/MHL In (front)' },
					{ id: '2', label: 'HDMI In (back)' },
					{ id: '3', label: 'ARC on HDMI Out 1' },
					{ id: '4', label: 'ARC on HDMI Out 2' },
					{ id: '5', label: 'Optical In (BDP-105 only)' },
					{ id: '6', label: 'Coaxial In (BDP-105 only)' },
					{ id: '7', label: 'USB Audio In (BDP-105 only)' },
				],
			},
		],
	},
	launch_application: {
		name: 'Apps: Launch application',
		cmd: 'APP',
		options: [
			{
				id: 'app',
				type: 'dropdown',
				label: 'Application',
				default: 'NFX',
				choices: [
					{ id: 'NFX', label: 'Netflix' },
					{ id: 'YOU', label: 'YouTube' },
					{ id: 'VUD', label: 'VUDU' },
					{ id: 'PAN', label: 'Pandora' },
					{ id: 'FFR', label: 'FilmFresh' },
					{ id: 'PIC', label: 'Picasa' },
					{ id: 'RHA', label: 'Rhapsody' },
					{ id: 'CIN', label: 'CinemaNow' },
				],
			},
		],
	},
	set_verbose_mode: {
		name: 'Misc: Set verbose mode',
		cmd: 'SVM',
		options: [
			{
				id: 'mode',
				type: 'dropdown',
				label: 'Verbose mode',
				default: '3',
				choices: [
					{ id: '0', label: '0 - Off (short responses)' },
					{ id: '1', label: '1 - Echo command code' },
					{ id: '2', label: '2 - Major status updates' },
					{ id: '3', label: '3 - Detailed updates incl. time code' },
				],
			},
		],
	},
}

// Queries used for status polling. `key` maps the response payload into module state.
const QUERIES = {
	QPW: { variable: 'power' },
	QVR: { variable: 'firmware_version' },
	QVL: { variable: 'volume' },
	QHD: { variable: 'hdmi_resolution' },
	QPL: { variable: 'playback_status' },
	QTK: { variable: 'track' },
	QCH: { variable: 'chapter' },
	QTE: { variable: 'time_track_elapsed' },
	QTR: { variable: 'time_track_remaining' },
	QCE: { variable: 'time_chapter_elapsed' },
	QCR: { variable: 'time_chapter_remaining' },
	QEL: { variable: 'time_total_elapsed' },
	QRE: { variable: 'time_total_remaining' },
	QDT: { variable: 'disc_type' },
	QAT: { variable: 'audio_type' },
	QST: { variable: 'subtitle_type' },
	QSH: { variable: 'subtitle_shift' },
	QOP: { variable: 'osd_position' },
	QRP: { variable: 'repeat_mode' },
	QZM: { variable: 'zoom_mode' },
	QIS: { variable: 'input_source' },
}

// Queries polled on an interval while the player is powered on.
const POLL_ON_QUERIES = ['QPW', 'QPL', 'QVL', 'QDT', 'QIS', 'QTK', 'QCH', 'QAT', 'QST', 'QRP', 'QZM']
// Queries polled while in standby (most commands get no response when off).
const POLL_OFF_QUERIES = ['QPW']
// Time-code queries polled at a faster cadence while transport is active.
const TIME_QUERIES = ['QTE', 'QTR', 'QCE', 'QCR', 'QEL', 'QRE']
// Queries run once after connect / power-on.
const INIT_QUERIES = [
	'QPW',
	'QVR',
	'QVL',
	'QHD',
	'QPL',
	'QDT',
	'QIS',
	'QTK',
	'QCH',
	'QRP',
	'QZM',
	'QAT',
	'QST',
	'QSH',
	'QOP',
	...TIME_QUERIES,
]
// Playback states in which time codes advance — worth polling every second.
const ACTIVE_PLAYBACK_STATES = ['PLAY', 'PAUSE', 'STEP', 'FREV', 'FFWD', 'SFWD', 'SREV']
const FAST_POLL_MS = 1000

const INPUT_SOURCES = {
	0: 'BD-PLAYER',
	1: 'HDMI-FRONT',
	2: 'HDMI-BACK',
	3: 'ARC-HDMI-OUT1',
	4: 'ARC-HDMI-OUT2',
	5: 'OPTICAL',
	6: 'COAXIAL',
	7: 'USB-AUDIO',
}

const DISC_TYPES = [
	'BD-MV',
	'DVD-VIDEO',
	'DVD-AUDIO',
	'SACD',
	'CDDA',
	'HDCD',
	'DATA-DISC',
	'VCD',
	'SVCD',
	'NO DISC',
	'UNKNOW-DISC',
]

const PLAYBACK_STATES = [
	'NO DISC',
	'LOADING',
	'OPEN',
	'CLOSE',
	'PLAY',
	'PAUSE',
	'STOP',
	'STEP',
	'FREV',
	'FFWD',
	'SFWD',
	'SREV',
	'SETUP',
	'HOME MENU',
	'MEDIA CENTER',
	'DISC MENU',
	'SCREEN SAVER',
]

// Verbose-mode playback update codes (UPL) mapped to the QPL-style status strings.
const UPL_STATES = {
	DISC: 'LOADING',
	LOAD: 'LOADING',
	OPEN: 'OPEN',
	CLOS: 'CLOSE',
	PLAY: 'PLAY',
	PAUS: 'PAUSE',
	STOP: 'STOP',
	STPF: 'STOP',
	STPR: 'STOP',
	HOME: 'HOME MENU',
	MCTR: 'MEDIA CENTER',
	FFW1: 'FFWD',
	FFW2: 'FFWD',
	FFW3: 'FFWD',
	FFW4: 'FFWD',
	FFW5: 'FFWD',
	FRV1: 'FREV',
	FRV2: 'FREV',
	FRV3: 'FREV',
	FRV4: 'FREV',
	FRV5: 'FREV',
	SFW1: 'SFWD',
	SFW2: 'SFWD',
	SFW3: 'SFWD',
	SFW4: 'SFWD',
	SRV1: 'SREV',
	SRV2: 'SREV',
	SRV3: 'SREV',
	SRV4: 'SREV',
}

const UDT_DISC_TYPES = {
	BDMV: 'BD-MV',
	DVDV: 'DVD-VIDEO',
	DVDA: 'DVD-AUDIO',
	SACD: 'SACD',
	CDDA: 'CDDA',
	HDCD: 'HDCD',
	DATA: 'DATA-DISC',
	VCD2: 'VCD',
	SVCD: 'SVCD',
}

const REPEAT_MODES = [
	'00 Off',
	'01 Repeat One',
	'02 Repeat Chapter',
	'03 Repeat All',
	'04 Repeat Title',
	'05 Shuffle',
	'06 Random',
]

export {
	SIMPLE_COMMANDS,
	PARAMETERIZED_COMMANDS,
	NUMERIC_KEYS,
	QUERIES,
	POLL_ON_QUERIES,
	POLL_OFF_QUERIES,
	INIT_QUERIES,
	TIME_QUERIES,
	ACTIVE_PLAYBACK_STATES,
	FAST_POLL_MS,
	INPUT_SOURCES,
	DISC_TYPES,
	PLAYBACK_STATES,
	UPL_STATES,
	UDT_DISC_TYPES,
	REPEAT_MODES,
}
