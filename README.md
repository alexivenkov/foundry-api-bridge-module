# Foundry API Bridge

HTTP REST API bridge for external access to Foundry VTT world data. Enables AI DM and other external tools to read journals, actors, scenes, items, and compendium packs.

## Description

This module automatically collects data from your Foundry VTT world and sends it to an external API server. Perfect for:
- 🤖 **AI Dungeon Masters** - Feed world data to AI for context-aware generation
- 📊 **Analytics & Dashboards** - Build real-time campaign statistics
- 🔄 **External Integrations** - Sync with other tools and platforms
- 💾 **Automated Backups** - Continuous world data backup

## Features

- 🔄 **Real-time World Data Sync** - Automatically collects and sends world data (journals, actors, scenes, items)
- 📚 **Compendium Support** - Load and send D&D 5e compendia (monsters, spells, items, etc.)
- ⚙️ **UI Configuration** - Easy configuration via Foundry settings menu
- 🔧 **TypeScript** - Fully typed with strict type checking
- 🎯 **Foundry v11-13** - Compatible with modern Foundry versions

## Technologies

- **TypeScript 5.6** - Strict type checking, no `any` types
- **Vite 5.4** - Modern build system
- **Jest 29** - Unit testing (77 tests)
- **ESLint 9** - Strict linting with typescript-eslint
- **Foundry VTT Types** - Full type support for Foundry API

## Installation

### Method 1: Install via Manifest URL (Recommended)

1. In Foundry VTT, go to **Add-on Modules**
2. Click **Install Module**
3. Paste this manifest URL:
   ```
   https://raw.githubusercontent.com/alexivenkov/foundry-api-bridge-module/master/dist/module.json
   ```
4. Click **Install**
5. Enable the module in your world
6. Configure via **Game Settings → Module Settings → Foundry API Bridge → Configure**

### Method 2: Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/alexivenkov/foundry-api-bridge-module/releases)
2. Extract to `Data/modules/foundry-api-bridge/`
3. Restart Foundry VTT
4. Enable the module in your world

## Configuration

After installation, configure the module via Foundry UI:

1. Open your world as GM
2. Go to **Game Settings → Configure Settings**
3. Find **Foundry API Bridge** in Module Settings
4. Click **Configure** button
5. Set your API server URL and other options

### Configuration Options

- **Server URL** - Your API server endpoint (e.g., `http://localhost:3001`)
- **Update Interval** - How often to send data (milliseconds)
- **World Data Endpoint** - API endpoint for world data (default: `/update`)
- **Compendium Endpoint** - API endpoint for compendium data (default: `/update-compendium`)
- **Features**:
  - Collect World Data
  - Enable Periodic Updates
  - Auto-load Compendium on Ready
- **Logging** - Enable/disable logging and set log level

## API Server Requirements

Your server should implement these endpoints:

### `POST /update`
Receives world data updates.

**Request body:**
```json
{
  "world": {
    "id": "my-world",
    "title": "My Campaign",
    "system": "dnd5e"
  },
  "counts": {
    "journals": 15,
    "actors": 23,
    "scenes": 8,
    "items": 45
  },
  "journals": [...],
  "actors": [...],
  "scenes": [...],
  "items": [...],
  "compendiumMeta": [...]
}
```

### `POST /update-compendium`
Receives compendium data.

**Request body:**
```json
{
  "packId": "dnd5e.monsters",
  "data": {
    "id": "dnd5e.monsters",
    "label": "D&D 5e Monsters",
    "type": "Actor",
    "documentCount": 425,
    "documents": [...]
  }
}
```

## License

MIT
