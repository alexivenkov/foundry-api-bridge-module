# Foundry API Bridge

Foundry VTT module that connects your world to [Foundry MCP](https://foundry-mcp.com), so an AI assistant — Claude, ChatGPT, Codex, Cursor, Gemini, or any MCP client — can read your campaign and act in it: roll dice, run combat, edit journals, move tokens, browse compendiums. The same module also serves the public [REST API](https://api.foundry-mcp.com/docs) at `api.foundry-mcp.com`.

The module keeps an outgoing WebSocket connection to the server, receives commands, executes them inside Foundry with GM permissions, and sends the results back. It activates only for the Game Master: nothing runs on players' clients, and nothing listens for incoming connections on your machine.

AI clients connect to `https://foundry-mcp.com/mcp` over MCP in one of two ways: **OAuth**, where you sign in with Patreon inside the client and never copy a key (Claude and ChatGPT connectors, Claude Code, Codex, Cursor, Gemini CLI, VS Code), or a **static API key** for clients that cannot do OAuth. See [Connect an AI client](#3-connect-an-ai-client).

## Installation

**From Foundry (recommended).** Add-on Modules → Install Module → search for **Foundry API Bridge** → Install. The module is listed on [foundryvtt.com](https://foundryvtt.com/packages/foundry-api-bridge) and updates through Foundry's normal update check.

**By manifest URL.** Paste this into the Manifest URL field of the Install Module dialog:

```
https://raw.githubusercontent.com/alexivenkov/foundry-api-bridge-module/master/dist/module.json
```

**Manually.** Download `foundry-api-bridge.zip` from the [latest release](https://github.com/alexivenkov/foundry-api-bridge-module/releases/latest), extract it into `Data/modules/foundry-api-bridge/`, restart Foundry.

Then enable the module in your world: Game Settings → Manage Modules.

## Setup

Three steps: get a key, put it into the module, connect an AI client. With OAuth the order can be reversed: connect the client first, and the key is created for you.

### 1. Get an API key

Open [foundry-mcp.com/auth/patreon](https://foundry-mcp.com/auth/patreon) — or click **Get API Key** under the API Key field in the module settings — and sign in with Patreon. You get a key of the form `pk_…` plus ready-to-paste setup instructions for every supported client. A Patreon account is enough to start; no subscription is required. The same page shows your key again whenever you come back to it.

If you connect an AI client through OAuth first (step 3), the key is created for you at that moment, and the same page shows it.

### 2. Configure the module

Game Settings → Configure Settings → Module Settings → **Foundry API Bridge**:

| Setting | Default | What it does |
|---|---|---|
| **MCP WebSocket URL** | `wss://foundry-mcp.com/ws` | Channel for AI assistants (MCP). Leave as is. |
| **API WebSocket URL** | `wss://api.foundry-mcp.com/v1/connect` | Channel for the public REST API. Leave as is, or clear it if you never use the REST API. |
| **API Key** | empty | Your `pk_…` key from step 1. Stored in this browser only; enter it again on another computer. |
| **Allow Script Macros** | off | Lets the API create and run script macros — arbitrary JavaScript with GM rights. Keep it off unless you need it and trust every client that holds your key. |

Save. Foundry reloads the world and two notifications confirm the link: `[MCP] Connected to server` and `[API] Connected to server`. After a network drop the module reconnects on its own: the delay doubles from 5 seconds up to a 60-second ceiling, and it keeps trying for as long as the world is open. While connected it pings the server every 25 seconds; a ping that goes unanswered means the connection is dead, and it is re-established without waiting. The same check runs when the browser comes back online or the tab becomes visible again.

The **Configure** button next to the module in the module list opens the advanced form:

| Setting | Default | Description |
|---|---|---|
| WebSocket Enabled | `true` | Turn the connections on or off without clearing the URLs |
| Reconnect Interval | 5000 ms | Base delay between reconnection attempts (doubles each time) |
| Max Reconnect Attempts | 0 | Attempts before the module gives up until the next reload; 0 = keep trying |
| Logging Enabled | `true` | Module logging in the browser console (`Foundry API Bridge \| …`) |
| Log Level | `info` | `debug`, `info`, `warn`, `error` |

### 3. Connect an AI client

The MCP endpoint is `https://foundry-mcp.com/mcp` (Streamable HTTP). Two ways to authenticate.

#### OAuth — recommended

You add the endpoint to the client and sign in with Patreon when it asks. No key is copied anywhere. Example with **Claude** (web or desktop app):

1. Open **Settings → Connectors** and click **Add custom connector**.
2. Name it `Foundry`, paste `https://foundry-mcp.com/mcp` as the URL, leave the OAuth client ID and secret empty, and click **Add**.
3. Click **Connect** on the new connector. A Patreon sign-in page opens; approve it and you are returned to Claude.
4. Start a chat and ask about your world. The Foundry tools are listed under the connector.

What happens behind the scenes: the client asks the endpoint, gets an OAuth challenge, discovers the authorization server at `foundry-mcp.com/oauth/*`, registers itself (OAuth 2.1 with PKCE, dynamic client registration or a client metadata document) and sends you to Patreon. The token it receives is tied to your Patreon account and to the same `pk_` key the module uses, so your tier applies everywhere. If you had no key yet, it is created at this moment and shown on [foundry-mcp.com/auth/patreon](https://foundry-mcp.com/auth/patreon).

The same works in every client that implements the MCP authorization spec:

| Client | Steps |
|---|---|
| **ChatGPT** (Pro / Team / Enterprise) | Settings → turn on **Developer Mode**. In a chat: **+** → Developer Mode → **Add Sources**, paste the URL, choose **OAuth**, sign in with Patreon. Leave client ID and secret empty. Enable the connector in each new chat. |
| **Claude Code** | `claude mcp add --transport http foundry https://foundry-mcp.com/mcp`, then run `/mcp` and choose **Authenticate**. |
| **Codex CLI** | `codex mcp add foundry --url https://foundry-mcp.com/mcp`, then `codex mcp login foundry`. |
| **Cursor** | `~/.cursor/mcp.json`: `{ "mcpServers": { "foundry": { "url": "https://foundry-mcp.com/mcp" } } }`, then click **Needs login** in Settings → MCP. |
| **Gemini CLI** | `gemini mcp add --transport http foundry https://foundry-mcp.com/mcp`, then `/mcp auth foundry`. |
| **VS Code** | `.vscode/mcp.json`: `{ "servers": { "foundry": { "type": "http", "url": "https://foundry-mcp.com/mcp" } } }`, then sign in when prompted. |

#### API key

For clients that cannot do OAuth, and for scripts: send `Authorization: Bearer pk_…` with every request, using the key from step 1.

| Client | Configuration |
|---|---|
| **Claude Code** | `claude mcp add --transport http --header "Authorization: Bearer pk_…" foundry https://foundry-mcp.com/mcp` |
| **Codex CLI** | `codex mcp add foundry --url https://foundry-mcp.com/mcp --bearer-token-env-var FOUNDRY_MCP_KEY`, with the key in that environment variable |
| **Cursor** | Add `"headers": { "Authorization": "Bearer pk_…" }` to the server entry in `~/.cursor/mcp.json` |
| **Gemini CLI** | `~/.gemini/settings.json` with `"httpUrl"` and `"headers"` |
| **VS Code** | Add `"headers"` to the server entry in `.vscode/mcp.json` |
| **Any other MCP client** | Endpoint `https://foundry-mcp.com/mcp`, Streamable HTTP, header `Authorization: Bearer pk_…` |

ChatGPT connectors support OAuth only.

Claude Desktop builds without connector support can use a config file and the key. It goes through [mcp-remote](https://www.npmjs.com/package/mcp-remote) and needs Node.js installed; restart Claude Desktop after saving:

```json
{
  "mcpServers": {
    "foundry": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote@latest",
        "https://foundry-mcp.com/mcp",
        "--transport", "http-only",
        "--header", "Authorization:Bearer pk_…"
      ]
    }
  }
}
```

Config file locations: macOS `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows `%APPDATA%\Claude\claude_desktop_config.json`, Linux `~/.config/Claude/claude_desktop_config.json`.

### What the assistant is allowed to do

Access follows your Patreon membership. A tool above your tier is still visible to the assistant; calling it returns a short message that names the required tier instead of running.

| Tier | Who | Unlocks |
|---|---|---|
| Guest | Patreon account, no membership | world info, dice rolls |
| Free | free Patreon member | actors, inventory and world items, folders, active effects, actor rolls (D&D 5e and Pathfinder 2e), chat |
| Adventurer | paid tier | journals, roll tables |
| Dungeon Master | paid tier | scenes and doors, tokens, combat, compendiums and imports, world time and pause, UI helpers |

Tiers are managed on [Patreon](https://www.patreon.com/c/nitromoon). A change of membership reaches the server automatically within a few minutes; no new key is needed.

## How it works

```
Foundry VTT (GM client)                foundry-mcp.com                    AI assistant
  Foundry API Bridge  ── WSS ──►  gateway ── MCP server  ◄── HTTPS/MCP ──  Claude, ChatGPT, Codex, …
                      ◄── WSS ──
  Foundry API Bridge  ── WSS ──►  api.foundry-mcp.com    ◄── HTTPS/REST ── your own scripts and tools
```

The module opens two outgoing WebSocket connections, one per server, authenticated with your key. When an assistant calls a tool (or a script calls the REST API), the server relays the command over the matching connection; the module runs it in the GM's browser session and returns the result. Each key has its own isolated data on the server, and world data is not shared between users.

Connection status shows as Foundry notifications; details are in the browser console under `Foundry API Bridge |`.

## Security

- Anyone who holds your key can control your world through the API. Treat it like a password.
- Commands run with GM permissions. Script macros are blocked unless **Allow Script Macros** is on.
- The key is stored in your browser (a client-scoped setting), not in the world, so players cannot read it. Enter it once in every browser you run the GM session from. Versions before 8.12.1 kept it in the world settings; the first start after updating moves it into the browser and deletes the world copy.

## Supported commands

164 commands. Names are what the server sends over the wire; MCP tools and REST routes map onto them.

### Dice, rolls & chat
`roll-dice` (up to 1000 dice per formula), `roll-ability`, `roll-skill`, `roll-save`, `roll-attack`, `roll-damage`, `roll-perception`, `send-chat-message`, `get-chat-messages`, `update-chat-message`, `delete-chat-message`, `clear-chat`, `export-chat`

### Actors
`get-actors`, `get-actor`, `filter-actors`, `create-actor`, `create-actor-from-compendium`, `update-actor`, `delete-actor`

### Items & inventory
`get-items`, `get-item`, `filter-items`, `create-item`, `create-item-from-compendium`, `update-item`, `delete-item`, `get-actor-items`, `add-item-to-actor`, `add-item-from-compendium`, `update-actor-item`, `delete-actor-item`, `use-item`, `activate-item`

### Active effects & status conditions
`get-actor-effects`, `add-actor-effect`, `update-actor-effect`, `remove-actor-effect`, `toggle-actor-status`

### Combat
`create-combat`, `delete-combat`, `start-combat`, `end-combat`, `next-turn`, `previous-turn`, `set-turn`, `add-combatant`, `remove-combatant`, `update-combatant`, `roll-initiative`, `roll-all-initiative`, `set-initiative`, `get-combat-state`, `get-combat-turn-context`, `set-combatant-defeated`, `toggle-combatant-visibility`

### Tokens
`create-token`, `delete-token`, `move-token`, `update-token`, `get-token`, `get-token-by-actor`, `get-scene-tokens`, `get-tokens-in-range`, `set-token-target`, `clear-targets`

`move-token` uses A* pathfinding with collision detection: tokens walk around walls and obstacles instead of teleporting, and can open doors along the way.

### Scenes, walls, doors & notes
`get-scene`, `get-scenes-list`, `activate-scene`, `view-scene`, `capture-scene`, `create-scene`, `update-scene`, `delete-scene`, `clone-scene`, `get-walls`, `create-wall`, `update-wall`, `delete-wall`, `set-door-state`, `get-notes`, `create-note`, `update-note`, `delete-note`

`get-scene` and `capture-scene` can return a screenshot of the scene as a base64 WebP image with a coordinate grid overlay for spatial reasoning.

### Journals
`get-journals`, `get-journal`, `create-journal`, `update-journal`, `delete-journal`, `show-journal`, `create-journal-page`, `update-journal-page`, `delete-journal-page`

`get-journals` accepts `light: true` for an index without page text (fast on large worlds); the server uses it for lists and search.

### Folders
`get-folders`, `get-folder`, `create-folder`, `update-folder`, `delete-folder`

### Roll tables
`list-roll-tables`, `get-roll-table`, `create-roll-table`, `update-roll-table`, `delete-roll-table`, `roll-on-table`, `reset-table`

### Macros
`get-macros`, `get-macro`, `create-macro`, `update-macro`, `delete-macro`, `execute-macro` (script macros require **Allow Script Macros**)

### Playlists & sounds
`get-playlists`, `get-playlist`, `play-playlist`, `stop-playlist`, `play-sound-in-playlist`, `stop-sound-in-playlist`, `play-sound-once`, `add-sound-to-playlist`

### Compendiums
`get-compendiums`, `get-compendium`, `get-compendium-index`, `get-compendium-document`, `search-compendium`, `search-compendiums`, `search-compendium-pages`, `import-from-compendium`, `resolve-uuid`

### World, time & UI
`get-world-info`, `get-world-time`, `advance-time`, `set-world-time`, `pause-game`, `resume-game`, `get-pause-state`, `notify`, `pan-canvas`, `ping-location`

### D&D 5e
`dnd5e/roll-ability`, `dnd5e/roll-skill`, `dnd5e/roll-save`, `dnd5e/roll-attack`, `dnd5e/roll-damage`, `dnd5e/roll-perception`, `dnd5e/use-item`, `dnd5e/activate-item`, `dnd5e/filter-compendium-actors`, `dnd5e/filter-compendium-items`

### Pathfinder 2e
`pf2e/roll-skill`, `pf2e/roll-save`, `pf2e/roll-perception`, `pf2e/list-strikes`, `pf2e/roll-strike`, `pf2e/roll-strike-damage`, `pf2e/cast-spell`, `pf2e/use-consumable`, `pf2e/post-item`, `pf2e/get-conditions`, `pf2e/set-condition`, `pf2e/increase-condition`, `pf2e/decrease-condition`, `pf2e/remove-condition`, `pf2e/filter-compendium-actors`, `pf2e/filter-compendium-items`

## Troubleshooting

- **The assistant says "Foundry not connected".** Open the world as GM with the module enabled and a key saved, and wait for the `[MCP] Connected to server` notification. The message from the server tells you when it last saw your world. If the module had given up reconnecting, reload the world.
- **A tool answers with a lock and a tier name.** That tool is above your Patreon tier; see the table above.
- **Nothing in the console.** The module only starts for the GM user. Check that logging is enabled in the Configure form.
- **Connected on one computer, not on another.** The key is stored per browser. Open the module settings on the other computer and paste it again.

## Compatibility

| Foundry VTT | Status |
|---|---|
| v14 | Verified |
| v13 | Verified |
| v12 | Verified |
| v11 | Minimum supported |

The core command set is system-agnostic; the `dnd5e/*` and `pf2e/*` commands require the respective game system.

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

The module builds into a single ES module (`dist/module.js`) via Vite. Symlink `dist/` into Foundry's `Data/modules/foundry-api-bridge/` for local development.

## Links

- [Foundry MCP](https://foundry-mcp.com) — the server side
- [REST API reference](https://api.foundry-mcp.com/docs)
- [Patreon](https://www.patreon.com/c/nitromoon) — support the project
- [Package page on foundryvtt.com](https://foundryvtt.com/packages/foundry-api-bridge)
- [Changelog](CHANGELOG.md)
- [Report issues](https://github.com/alexivenkov/foundry-api-bridge-module/issues)

## License

MIT
