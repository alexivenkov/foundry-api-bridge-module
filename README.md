# Foundry API Bridge

Connect your Foundry VTT world to [foundry-mcp.com](https://foundry-mcp.com) — a platform that lets AI assistants (Claude, ChatGPT, etc.) control Foundry VTT through the MCP protocol.

This module is the client-side component of [Foundry MCP](https://github.com/alexivenkov/foundry-mcp). It enables bidirectional communication between Foundry VTT and the Foundry MCP server:

- **Outbound (REST)**: Periodically sends world data (journals, actors, scenes, items, compendia) to the server so AI has full context about your campaign
- **Inbound (WebSocket)**: Receives commands from the server (dice rolls, combat management, journal editing, token manipulation, etc.) and executes them in Foundry

## Installation

### Install via Manifest URL (Recommended)

1. In Foundry VTT, go to **Add-on Modules**
2. Click **Install Module**
3. Paste the manifest URL:
   ```
   https://raw.githubusercontent.com/alexivenkov/foundry-api-bridge-module/master/dist/module.json
   ```
4. Click **Install**
5. Enable the module in your world

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/alexivenkov/foundry-api-bridge-module/releases)
2. Extract to `Data/modules/foundry-api-bridge/`
3. Restart Foundry VTT
4. Enable the module in your world

## Setup

### 1. Get an API Key

1. Go to [foundry-mcp.com/auth/patreon](https://foundry-mcp.com/auth/patreon)
2. Sign in with your Patreon account
3. Copy your API key (format: `pk_...`)

### 2. Configure the Module

1. Open your world as GM
2. Go to **Game Settings → Configure Settings → Module Settings**
3. Find **Foundry API Bridge** and fill in:

| Setting | Value |
|---------|-------|
| **Server URL** | `https://foundry-mcp.com/api` |
| **WebSocket URL** | `wss://foundry-mcp.com/ws` |
| **API Key** | Your `pk_...` key from step 1 |

4. Save and reload the world

### 3. Advanced Configuration (Optional)

Click **Configure** next to the module name to access additional settings:

| Setting | Default | Description |
|---------|---------|-------------|
| Update Interval | 5000 ms | How often world data is sent to the server |
| World Data Endpoint | `/update` | REST endpoint for world data |
| Compendium Endpoint | `/update-compendium` | REST endpoint for compendium data |
| Collect World Data | Enabled | Toggle world data collection |
| Periodic Updates | Enabled | Toggle periodic data sync |
| Auto-load Compendium | Enabled | Automatically send selected compendia on startup |
| Compendium Selection | — | Choose which compendium packs to sync |

## How It Works

Once configured, the module:

1. **Syncs world data** — Periodically sends your world's journals, actors, scenes, and items to the Foundry MCP server via REST API
2. **Listens for commands** — Maintains a WebSocket connection to receive and execute commands from the server
3. **Shows connection status** — Displays notifications when the WebSocket connection is established or lost

The AI assistant connected through MCP can then:
- Read your campaign data for context
- Roll dice and skill checks
- Create and edit journal entries
- Manage combat encounters and initiative
- Place and move tokens on scenes
- Manage actor items and effects

## Compatibility

| Foundry VTT Version | Status |
|---------------------|--------|
| v13 (Build 350) | Verified |
| v12 | Verified |
| v11 | Minimum supported |

## Links

- [Foundry MCP Platform](https://foundry-mcp.com) — The server-side platform
- [Foundry MCP Server Repository](https://github.com/alexivenkov/foundry-mcp) — Server source code
- [Patreon](https://foundry-mcp.com/auth/patreon) — Get your API key
- [Report Issues](https://github.com/alexivenkov/foundry-api-bridge-module/issues)

## License

MIT
