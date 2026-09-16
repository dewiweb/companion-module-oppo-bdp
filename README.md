# companion-module-oppo-bdp

[Bitfocus Companion](https://bitfocus.io/companion) module for OPPO BDP-series Blu-ray players
(BDP-83, BDP-93, BDP-95, BDP-103, BDP-105) using the player's TCP control protocol.

See [companion/HELP.md](companion/HELP.md) for usage documentation.

## Install

### From the packaged module (recommended)

```sh
npm install
npm run package   # produces oppo-bdp-<version>.tgz
```

Then in Companion (4.x / 5.x):

1. Open **Modules** in the left sidebar
2. Click **Import module package** and select the `.tgz` file
3. Add a new **Connection**, search for "OPPO BDP", and configure the player IP/port

### As a developer module

Clone this repo inside a folder, run `npm install`, then in Companion's launcher
window: cog icon → **Developer** → select the *parent* folder as the developer
modules path and enable developer modules.
