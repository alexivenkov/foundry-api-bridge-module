# Foundry API Bridge

[![Foundry version](https://img.shields.io/endpoint?url=https%3A%2F%2Ffoundryshields.com%2Fversion%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Falexivenkov%2Ffoundry-api-bridge-module%2Fmaster%2Fdist%2Fmodule.json)](https://foundryvtt.com/packages/foundry-api-bridge)
[![Latest release](https://img.shields.io/github/v/release/alexivenkov/foundry-api-bridge-module)](https://github.com/alexivenkov/foundry-api-bridge-module/releases/latest)
[![smithery badge](https://smithery.ai/badge/ai-nitromoon/foundry-vtt)](https://smithery.ai/servers/ai-nitromoon/foundry-vtt)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-com.foundry--mcp%2Ffoundry-blue)](https://registry.modelcontextprotocol.io/v0/servers?search=com.foundry-mcp)
[![License: MIT](https://img.shields.io/github/license/alexivenkov/foundry-api-bridge-module)](LICENSE)

Foundry VTT module that connects your world to [Foundry MCP](https://foundry-mcp.com), so an AI assistant — Claude, ChatGPT, Codex, Cursor, Gemini or any MCP client — can read your campaign and act in it: roll dice, run combat, write journals, move tokens, import from compendiums. It is built for Game Masters: the module runs only on the GM's client, keeps one outgoing connection to the server and executes commands inside Foundry with GM permissions. The same module serves the public [REST API](https://api.foundry-mcp.com/docs) at `api.foundry-mcp.com`.

## What you get

- **121 tools** over MCP: actors & inventory, dice & combat, journals & roll tables, scenes & tokens, compendium search & import, world time & UI.
- **D&D 5e and Pathfinder 2e aware.** The core works with any game system. `dnd5e/*` adds ability, skill, save, attack and damage rolls and item use; `pf2e/*` adds skills, saves, strikes, conditions, spells and consumables.
- **Public REST API** for bots, dashboards and your own scripts, with the same module and the same key: [api.foundry-mcp.com/docs](https://api.foundry-mcp.com/docs).
- **Code mode (preview).** The assistant writes a short TypeScript script against a typed `foundry.*` API and runs it in a sandbox: one round trip instead of dozens of tool calls. See [Code mode](#code-mode-preview) and [foundry-mcp.com/code](https://foundry-mcp.com/code).

## Quick start

1. In Foundry VTT: Add-on Modules → Install Module → search for **Foundry API Bridge** → Install, then enable it in your world.
2. Open the module settings, click **Get API Key**, sign in with Patreon and paste the key back. A free Patreon account is enough.
3. Add `https://foundry-mcp.com/mcp` to your AI client and sign in with Patreon when it asks.

The rest of this page has the details for each step.

## Installation

**From Foundry (recommended).** Add-on Modules → Install Module → search for **Foundry API Bridge** → Install. The module is listed on [foundryvtt.com](https://foundryvtt.com/packages/foundry-api-bridge) and updates through Foundry's normal update check.

**By manifest URL.** Paste this into the Manifest URL field of the Install Module dialog:

```
https://raw.githubusercontent.com/alexivenkov/foundry-api-bridge-module/master/dist/module.json
```

**Manually.** Download `foundry-api-bridge.zip` from the [latest release](https://github.com/alexivenkov/foundry-api-bridge-module/releases/latest), extract it into `Data/modules/foundry-api-bridge/`, restart Foundry.

Then enable the module in your world: Game Settings → Manage Modules.

## Setup

### API key

Open [foundry-mcp.com/auth/patreon](https://foundry-mcp.com/auth/patreon), or click **Get API Key** under the API Key field in the module settings, and sign in with Patreon. You get a key of the form `pk_…` plus setup instructions for every supported client. No subscription is required to start. The same page shows your key again whenever you come back to it.

If you connect an AI client through OAuth first, the key is created for you at that moment and appears on the same page.

### Module settings

Game Settings → Configure Settings → Module Settings → **Foundry API Bridge**:

| Setting | Default | What it does |
|---|---|---|
| **MCP WebSocket URL** | `wss://foundry-mcp.com/ws` | Channel for AI assistants (MCP). Leave as is. |
| **API WebSocket URL** | `wss://api.foundry-mcp.com/v1/connect` | Channel for the public REST API. Leave as is, or clear it if you never use the REST API. |
| **API Key** | empty | Your `pk_…` key. Stored in this browser only; enter it again on another computer. |
| **Allow Script Macros** | off | Lets the API create and run script macros: arbitrary JavaScript with GM rights. Keep it off unless you need it and trust every client that holds your key. |

Save. Foundry reloads the world and two notifications confirm the link: `[MCP] Connected to server` and `[API] Connected to server`.

After a network drop the module reconnects on its own. The delay doubles from 5 seconds up to a 60-second ceiling, and it keeps trying for as long as the world is open. While connected it pings the server every 25 seconds; an unanswered ping means the connection is dead, and it is re-established without waiting. The same check runs when the browser comes back online or the tab becomes visible again.

The **Configure** button next to the module in the module list opens the advanced form:

| Setting | Default | Description |
|---|---|---|
| Enable WebSocket | on | Turn the connections on or off without clearing the URLs |
| Reconnect Interval (ms) | 5000 | Base delay between reconnection attempts; doubles each time |
| Max Reconnect Attempts | 0 | Attempts before the module gives up until the next reload; 0 = keep trying |
| Enable Logging | on | Module logging in the browser console (`Foundry API Bridge \| …`) |
| Log Level | `info` | `debug`, `info`, `warn`, `error` |

## Connect an AI client

The MCP endpoint is `https://foundry-mcp.com/mcp` (Streamable HTTP). Where the client supports OAuth, add the URL and sign in with Patreon when asked: no key is copied anywhere. Where it does not, use the API key.

| Client | How to connect |
|---|---|
| **Claude** (web or desktop) | Settings → Connectors → **Add custom connector**. Name `Foundry`, URL `https://foundry-mcp.com/mcp`, leave client ID and secret empty, click **Add**, then **Connect** and sign in with Patreon. |
| **ChatGPT** (Pro / Team / Enterprise) | Settings → turn on **Developer Mode**. In a chat: **+** → Developer Mode → **Add Sources**, paste the URL, choose **OAuth**, sign in with Patreon. Leave client ID and secret empty. Enable the connector in each new chat. |
| **Claude Code** | `claude mcp add --transport http foundry https://foundry-mcp.com/mcp`, then run `/mcp` and choose **Authenticate**. |
| **Codex CLI** | `codex mcp add foundry --url https://foundry-mcp.com/mcp`, then `codex mcp login foundry`. |
| **Cursor** | `~/.cursor/mcp.json`: `{ "mcpServers": { "foundry": { "url": "https://foundry-mcp.com/mcp" } } }`, then click **Needs login** in Settings → MCP. |
| **VS Code** | `.vscode/mcp.json`: `{ "servers": { "foundry": { "type": "http", "url": "https://foundry-mcp.com/mcp" } } }`, then sign in when prompted. |
| **Gemini CLI** | `gemini mcp add --transport http foundry https://foundry-mcp.com/mcp`, then `/mcp auth foundry`. |
| **Windsurf** | API key. `~/.codeium/windsurf/mcp_config.json`: `{ "mcpServers": { "foundry": { "serverUrl": "https://foundry-mcp.com/mcp", "headers": { "Authorization": "Bearer pk_…" } } } }` |
| **Cline** | API key. MCP Servers → Remote Servers, name `foundry`, URL `https://foundry-mcp.com/mcp`, then add `"headers": { "Authorization": "Bearer pk_…" }` to the entry in `cline_mcp_settings.json`. |

How OAuth works: the client asks the endpoint, gets an OAuth challenge, discovers the authorization server at `foundry-mcp.com/oauth/*`, registers itself (OAuth 2.1 with PKCE, dynamic client registration or a client metadata document) and sends you to Patreon. The token it receives is tied to your Patreon account and to the same `pk_` key the module uses, so your tier applies everywhere. Command-line and desktop clients that redirect to a `localhost` callback (Claude Code, Codex CLI, Cursor, Gemini CLI, VS Code) are supported since 2026-09-21.

<details>
<summary><b>API key instead of OAuth</b></summary>

For clients that cannot do OAuth, and for scripts: send `Authorization: Bearer pk_…` with every request, using the key from the module settings.

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

</details>

## Code mode (preview)

A second endpoint, `https://foundry-mcp.com/mcp/code`, exposes three tools: `docs` (the index of the typed `foundry.*` API, 19 domains and 118 methods, with methods above your tier marked 🔒), `query` (runs a read-only script) and `execute` (runs a script with the full API). The assistant reads the index, writes a short TypeScript script and the server runs it in a QuickJS sandbox against your world, returning a trace of every call with the ids it touched. A static check refuses the script before it runs if it calls a method your tier lacks.

Same module, same key. Keep `/mcp` connected as well: code mode adds to the 121 tools, it does not replace them.

| Client | How to connect |
|---|---|
| **Claude Code** | `claude mcp add --transport http foundry-code https://foundry-mcp.com/mcp/code`, then `/mcp` → **Authenticate**. |
| **Codex CLI** | `codex mcp add foundry-code --url https://foundry-mcp.com/mcp/code`, then `codex mcp login foundry-code`. |
| **Claude** (web or desktop) | Settings → Connectors → **Add custom connector**, URL `https://foundry-mcp.com/mcp/code`, leave client ID and secret empty, connect. |

| Limit | Value |
|---|---|
| Calls per script | 150 |
| Writes per script | 150 |
| Deletes per script | 30 |
| Wall time per script | 60 s |
| CPU time per script | 15 s |
| Script result | 48 KB |
| Result of a single call | 256 KB |
| Runs per day | Guest 10, Free 30, Adventurer 100, Dungeon Master unlimited |

There are no transactions. A script that fails half-way does not roll back what it already did; the trace tells you exactly what happened, and you continue from there. More on [foundry-mcp.com/code](https://foundry-mcp.com/code).

## Tiers

Access follows your Patreon membership. Counts are wire commands by the lowest tier that unlocks them.

| Tier | Price | Commands | Unlocks |
|---|---|---|---|
| Guest | Patreon account, no membership | 2 | `get-world-info`, `roll-dice` |
| Free | free Patreon membership | +56 | actors, inventory and world items, folders, active effects, D&D 5e and Pathfinder 2e rolls, chat, initiative |
| Adventurer | €3 / month | +16 | journals, roll tables |
| Dungeon Master | €10 / month | +45 | scenes and doors, tokens, combat, compendiums and import, world time, pause, UI helpers |

A tool above your tier stays visible to the assistant; calling it returns a short message that names the required tier instead of running. Tiers are managed on [Patreon](https://www.patreon.com/c/nitromoon). A change of membership reaches the server automatically; no new key is needed.

## How it works

```
Foundry VTT (GM client)                foundry-mcp.com                    AI assistant
  Foundry API Bridge  ── WSS ──►  gateway ── MCP server  ◄── HTTPS/MCP ──  Claude, ChatGPT, Codex, …
                      ◄── WSS ──
  Foundry API Bridge  ── WSS ──►  api.foundry-mcp.com    ◄── HTTPS/REST ── your own scripts and tools
```

The module opens two outgoing WebSocket connections, one per server, authenticated with your key. When an assistant calls a tool, or a script calls the REST API, the server relays the command over the matching connection; the module runs it in the GM's browser session and returns the result. Each key has its own isolated data on the server, and world data is not shared between users. Connection status shows as Foundry notifications; details are in the browser console under `Foundry API Bridge |`.

## Security & privacy

- The module starts only for the Game Master. Nothing runs on players' clients, and nothing listens for incoming connections on your machine: the module opens outgoing connections only.
- Your world is not stored on the server. Commands pass through to your Foundry client and results go straight back. Revoke access by deleting the key.
- Anyone who holds your key can control your world through the API. Treat it like a password.
- The key is stored in your browser (a client-scoped setting), not in the world, so players cannot read it. Enter it once in every browser you run the GM session from. Versions before 8.12.1 kept it in the world settings; the first start after updating moves it into the browser and deletes the world copy.
- Commands run with GM permissions. Script macros are blocked unless **Allow Script Macros** is on.
- [Privacy policy](https://foundry-mcp.com/privacy) · [Terms of service](https://foundry-mcp.com/terms)

## Supported commands

168 wire commands. Names are what the server sends over the wire; MCP tools and REST routes map onto them. The full list, with notes on each group, is in [docs/COMMANDS.md](docs/COMMANDS.md).

| Group | Commands | Examples |
|---|---|---|
| Dice, rolls & chat | 13 | `roll-dice`, `roll-skill`, `send-chat-message`, `export-chat` |
| Actors | 9 | `get-actors`, `filter-actors`, `create-actor-from-compendium`, `apply-damage` |
| Items & inventory | 14 | `get-actor-items`, `add-item-from-compendium`, `use-item` |
| Active effects & status conditions | 5 | `add-actor-effect`, `toggle-actor-status` |
| Combat | 17 | `start-combat`, `next-turn`, `roll-initiative`, `get-combat-turn-context` |
| Tokens | 10 | `move-token` (A* pathfinding), `get-tokens-in-range`, `set-token-target` |
| Scenes, walls, doors & notes | 18 | `get-scene`, `capture-scene`, `set-door-state`, `create-note` |
| Journals | 9 | `get-journals`, `create-journal-page`, `show-journal` |
| Folders | 5 | `get-folders`, `create-folder` |
| Roll tables | 7 | `roll-on-table`, `create-roll-table` |
| Macros | 6 | `execute-macro` (script macros need **Allow Script Macros**) |
| Playlists & sounds | 8 | `play-playlist`, `play-sound-once` |
| Compendiums | 9 | `search-compendiums`, `import-from-compendium`, `resolve-uuid` |
| World, time & UI | 10 | `get-world-info`, `advance-time`, `pause-game`, `ping-location` |
| D&D 5e (`dnd5e/*`) | 12 | `dnd5e/roll-attack`, `dnd5e/activate-item`, `dnd5e/apply-damage`, `dnd5e/filter-compendium-actors` |
| Pathfinder 2e (`pf2e/*`) | 16 | `pf2e/roll-strike`, `pf2e/set-condition`, `pf2e/cast-spell` |

The core command set is system-agnostic. `dnd5e/*` and `pf2e/*` commands require the matching game system in the world; calling one in another system returns `Operation '<command>' is not supported by game system '<world>'`. The bare `roll-ability`, `roll-skill`, `roll-save`, `roll-attack`, `roll-damage`, `roll-perception`, `use-item` and `activate-item` are legacy aliases of the `dnd5e/*` commands; `apply-damage` and `apply-healing` are aliases of `dnd5e/apply-damage` and `dnd5e/apply-healing`.

## Troubleshooting

- **The assistant says "Foundry not connected".** Open the world as GM with the module enabled and a key saved, and wait for the `[MCP] Connected to server` notification. The message from the server tells you when it last saw your world. If the module had given up reconnecting, reload the world.
- **A tool answers with a lock and a tier name.** That tool is above your Patreon tier; see [Tiers](#tiers).
- **OAuth login fails in a CLI client.** Update the client to its latest version and try again. Sign-in from Claude Code, Codex CLI, Cursor, Gemini CLI and VS Code works since 2026-09-21; before that date the authorization server rejected clients with a `localhost` callback.
- **429 / rate limited.** The limit is 240 requests per minute per key (Dungeon Master: twice that). Wait a minute and retry.
- **Nothing in the console.** The module only starts for the GM user. Check that logging is enabled in the Configure form.
- **Connected on one computer, not on another.** The key is stored per browser. Open the module settings on the other computer and paste it again.

## Compatibility

| Foundry VTT | Status |
|---|---|
| v14 | Verified |
| v13 | Verified |
| v12 | Verified |
| v11 | Minimum supported |

Module version 8.14.0. The core command set works with any game system; `dnd5e/*` and `pf2e/*` require the respective system.

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
- [Code mode](https://foundry-mcp.com/code)
- [REST API reference](https://api.foundry-mcp.com/docs)
- [MCP Registry](https://registry.modelcontextprotocol.io/v0/servers?search=com.foundry-mcp) — `com.foundry-mcp/foundry` and `com.foundry-mcp/foundry-code`
- [Smithery](https://smithery.ai/servers/ai-nitromoon/foundry-vtt) · [Smithery, code mode](https://smithery.ai/servers/ai-nitromoon/foundry-vtt-code)
- [Glama](https://glama.ai/mcp/remote-servers/com.foundry-mcp/foundry)
- [Patreon](https://www.patreon.com/c/nitromoon) — support the project
- [Package page on foundryvtt.com](https://foundryvtt.com/packages/foundry-api-bridge)
- [Wiki](https://github.com/alexivenkov/foundry-api-bridge-module/wiki)
- [Full command list](docs/COMMANDS.md) · [Changelog](CHANGELOG.md)
- [Report issues](https://github.com/alexivenkov/foundry-api-bridge-module/issues)

## License

MIT
