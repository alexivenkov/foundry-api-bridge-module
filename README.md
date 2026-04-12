# Foundry API Bridge

Client-side Foundry VTT module for [Foundry MCP](https://foundry-mcp.com). Connects Foundry to AI assistants (Claude, ChatGPT, etc.) via the MCP protocol.

The module maintains a WebSocket connection to the Foundry MCP server, receives commands, executes them in Foundry, and sends results back. GM-only — the module activates only for the Game Master.

## Installation

### Via Manifest URL (Recommended)

1. In Foundry VTT, go to **Add-on Modules → Install Module**
2. Paste the manifest URL:
   ```
   https://raw.githubusercontent.com/alexivenkov/foundry-api-bridge-module/master/dist/module.json
   ```
3. Click **Install**
4. Enable the module in your world

### Manual

1. Download the latest release from [GitHub Releases](https://github.com/alexivenkov/foundry-api-bridge-module/releases)
2. Extract to `Data/modules/foundry-api-bridge/`
3. Restart Foundry VTT and enable the module

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
| **WebSocket URL** | `wss://foundry-mcp.com/ws` (pre-filled by default) |
| **API Key** | Your `pk_...` key |

4. Save and reload the world

### 3. Advanced Configuration (Optional)

Click **Configure** next to the module name to access WebSocket and logging settings:

| Setting | Default | Description |
|---------|---------|-------------|
| WebSocket Enabled | `true` | Enable/disable WebSocket connection |
| Reconnect Interval | 5000 ms | Base delay between reconnection attempts (exponential backoff) |
| Max Reconnect Attempts | 10 | Maximum reconnection attempts before giving up |
| Logging Enabled | `true` | Enable/disable module logging |
| Log Level | `info` | Logging verbosity: `debug`, `info`, `warn`, `error` |

## How It Works

The module connects to the Foundry MCP server via WebSocket. When the AI assistant sends a command through MCP, the server relays it to Foundry over this WebSocket. The module executes the command and sends the result back.

Connection status is displayed as Foundry notifications (connected/disconnected). If the connection drops, the module automatically reconnects with exponential backoff.

## Supported Commands

### Dice & Chat
`roll-dice`, `send-chat-message`

### Actors
`get-actors`, `get-actor`, `create-actor`, `create-actor-from-compendium`, `update-actor`, `delete-actor`

### Actor Rolls
`roll-ability`, `roll-skill`, `roll-save`, `roll-attack`, `roll-damage`

### Combat
`create-combat`, `delete-combat`, `start-combat`, `end-combat`, `next-turn`, `previous-turn`, `set-turn`, `add-combatant`, `remove-combatant`, `update-combatant`, `roll-initiative`, `roll-all-initiative`, `set-initiative`, `get-combat-state`, `get-combat-turn-context`, `set-combatant-defeated`, `toggle-combatant-visibility`

### Tokens
`create-token`, `delete-token`, `move-token`, `update-token`, `get-scene-tokens`

`move-token` uses A* pathfinding with collision detection — tokens navigate around walls and obstacles instead of teleporting. Supports door interaction along the path.

### Items
`get-items`, `get-item`, `get-actor-items`, `use-item`, `activate-item`, `add-item-to-actor`, `add-item-from-compendium`, `update-actor-item`, `delete-actor-item`

### Journals
`get-journals`, `get-journal`, `create-journal`, `update-journal`, `delete-journal`, `create-journal-page`, `update-journal-page`, `delete-journal-page`

### Scenes
`get-scene`, `get-scenes-list`, `activate-scene`, `capture-scene`

`get-scene` and `capture-scene` can return a scene screenshot as a base64 WebP image with a coordinate grid overlay for spatial reasoning.

### Effects & Status Conditions
`get-actor-effects`, `toggle-actor-status`, `add-actor-effect`, `remove-actor-effect`, `update-actor-effect`

### Roll Tables
`list-roll-tables`, `get-roll-table`, `roll-on-table`, `reset-table`, `create-roll-table`, `update-roll-table`, `delete-roll-table`

### Doors
`set-door-state` — open, close, or lock doors on scene walls

### World Data & Compendiums
`get-world-info`, `get-compendiums`, `get-compendium`

## Compatibility

| Foundry VTT Version | Status |
|---------------------|--------|
| v13 | Verified |
| v12 | Verified |
| v11 | Minimum supported |

## Development

```bash
npm install          # Install dependencies
npm run dev          # Watch mode build
npm run build        # Production build (type-check + Vite + copy config)
npm test             # Run tests
npm run lint         # ESLint check
npm run type-check   # TypeScript check only
npm run all          # lint + test + build
```

The module builds into a single ES module (`dist/module.js`) via Vite. Link `dist/` as a symlink in Foundry's `Data/modules/foundry-api-bridge/` for local development.

## Links

- [Foundry MCP](https://foundry-mcp.com) — Server-side platform
- [Patreon](https://www.patreon.com/c/nitromoon) — Support the project
- [Report Issues](https://github.com/alexivenkov/foundry-api-bridge-module/issues)

## License

MIT
