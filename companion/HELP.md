# OPPO BDP Blu-ray Player

Controls OPPO BDP-83, BDP-93, BDP-95, BDP-103 and BDP-105 Blu-ray players over the network using the player TCP control protocol (the same command set as the OPPO RS-232 protocol, framed as `REMOTE <CODE>`).

## Configuration

| Setting       | Description                               | Default       |
| ------------- | ----------------------------------------- | ------------- |
| Target IP     | IP address of the player                  | `192.168.0.1` |
| Target Port   | TCP control port                          | `48360`       |
| Poll interval | Status polling while powered on (seconds) | `5`           |

Default control ports per model:

- BDP-83: `19999`
- BDP-93 / BDP-95 / BDP-103 / BDP-105: `48360`

The player must have network control enabled. To control power-on from standby, enable the player's "network in standby" option in its setup menu.

## Actions

- Power: toggle, discrete on, discrete off
- Playback: play, pause, stop, previous, next, fast forward, fast reverse
- Disc tray open/close, direct play, search to position, GOTO
- Navigation: up/down/left/right, enter, return, page up/down
- Menus: home, top menu, pop-up menu, setup, OSD, option menu, 3D menu, picture adjustment
- Numeric keys 0-9, clear
- Volume: up, down, set level, mute toggle
- Input source: INPUT button and direct selection (BD Player, HDMI front/back, ARC HDMI out 1/2, optical, coaxial, USB audio — audio inputs are BDP-105 only)
- Audio language, subtitle language/subtitle shift, camera angle, SAP
- Repeat: repeat button, A-B repeat, direct repeat-mode set
- Zoom button and direct zoom-ratio set
- Resolution: resolution button and direct HDMI resolution set, TV system
- Dimmer, pure audio, PIP, colour keys (red/green/blue/yellow)
- Apps: Netflix, VUDU and generic app launch
- Verbose mode, reset command buffer, NOP, raw command

## Feedbacks

- Power state (on/standby)
- Playback status (play, pause, stop, loading, menus, etc.)
- Disc type (BD, DVD, SACD, CD, ...)
- Input source
- Muted
- Repeat mode

## Variables

`power`, `playback_status`, `disc_type`, `volume`, `muted`, `input_source`, `track`, `chapter`, `time_track_elapsed`, `time_track_remaining`, `time_chapter_elapsed`, `time_chapter_remaining`, `time_total_elapsed`, `time_total_remaining`, `audio_type`, `subtitle_type`, `repeat_mode`, `zoom_mode`, `hdmi_resolution`, `firmware_version`

## Notes

- The module tries to enable unsolicited status updates (verbose mode 3) on power-on. Some firmwares
  ignore `SVM` over the network interface, in which case state is kept fresh by polling at the
  configured interval.
- Time-code variables (elapsed/remaining) are polled once per second while a disc is playing.
- While the player is in standby only the power query is polled.
- Commands are rate-limited and serialised; the player only processes one command at a time.
- Note: the HTTP JSON API (`sendremotekey` on port 436) used by the OPPO MediaControl app is **not**
  exposed by all firmware revisions — this module uses the TCP `REMOTE` protocol instead, which is
  always available.

Protocol references: OPPO BDP-103 RS-232 Protocol v1.1 (same 3-letter command set), plus community reverse-engineering of the IP `REMOTE` framing.
