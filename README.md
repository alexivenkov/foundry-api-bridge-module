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
- 🔌 **WebSocket Bidirectional Communication** - Execute commands in Foundry from external server
- 🎲 **Dice Rolling** - Roll dice via WebSocket using Foundry Roll API
- ⚙️ **UI Configuration** - Easy configuration via Foundry settings menu
- 🔧 **TypeScript** - Fully typed with strict type checking
- 🎯 **Foundry v11-13** - Compatible with modern Foundry versions

## Technologies

- **TypeScript 5.6** - Strict type checking, no `any` types
- **Vite 5.4** - Modern build system
- **Jest 29** - Unit testing
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
- **Compendia Auto-Load** - Select which compendium packs to load automatically with checkboxes
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

## WebSocket Communication

The module can connect to your server via WebSocket for bidirectional communication. Foundry acts as a **client**, your Node.js server acts as a **server**.

### Configuration

Enable in Foundry settings:
- **Enable WebSocket** - Toggle connection
- **Server URL** - WebSocket endpoint (e.g., `ws://localhost:3001/ws`)
- **Reconnect Interval** - Retry delay in ms (default: 5000)
- **Max Reconnect Attempts** - Limit retries (default: 10)

### Protocol

Commands and responses are JSON messages:

**Command (server → Foundry):**
```json
{ "type": "roll-dice", "id": "uuid", "params": { "formula": "1d20+5" } }
```

**Response (Foundry → server):**
```json
{ "type": "roll-dice", "id": "uuid", "success": true, "result": { "total": 18, "formula": "1d20+5", "dice": [{"faces": 20, "results": [13]}] } }
```

### Available Commands

| Command | Params | Description |
|---------|--------|-------------|
| `roll-dice` | `{ formula, showInChat?, flavor? }` | Execute dice roll via Foundry Roll API |
| `roll-skill` | `{ actorId, skill, showInChat? }` | Roll skill check for actor (D&D 5e) |
| `roll-save` | `{ actorId, ability, showInChat? }` | Roll saving throw for actor (D&D 5e) |
| `roll-ability` | `{ actorId, ability, showInChat? }` | Roll ability check for actor (D&D 5e) |
| `roll-attack` | `{ actorId, itemId, advantage?, disadvantage?, showInChat? }` | Roll attack with weapon/spell (D&D 5e) |
| `roll-damage` | `{ actorId, itemId, critical?, showInChat? }` | Roll damage for weapon/spell (D&D 5e) |
| `create-journal` | `{ name, folder?, content?, pageType? }` | Create a new journal entry |
| `update-journal` | `{ journalId, name?, folder? }` | Update journal entry properties |
| `delete-journal` | `{ journalId }` | Delete a journal entry |
| `create-journal-page` | `{ journalId, name, type?, content? }` | Add a page to existing journal |
| `update-journal-page` | `{ journalId, pageId, name?, content? }` | Update journal page content |
| `delete-journal-page` | `{ journalId, pageId }` | Delete a journal page |
| `create-combat` | `{ sceneId?, activate? }` | Create a new combat encounter |
| `add-combatant` | `{ actorId, combatId?, tokenId?, initiative?, hidden? }` | Add combatant to combat |

**roll-dice params:**
- `formula` - Dice formula (`1d20`, `2d6+3`, `4d6kh3`, `2d20kh1` for advantage)
- `showInChat` - Show result in Foundry chat (default: false)
- `flavor` - Chat message flavor text

**roll-skill params:**
- `actorId` - Actor ID to roll for
- `skill` - Skill abbreviation (see table below)
- `showInChat` - Show result in Foundry chat (default: false)

**D&D 5e Skill Keys:**
| Key | Skill | Key | Skill |
|-----|-------|-----|-------|
| `acr` | Acrobatics | `med` | Medicine |
| `ani` | Animal Handling | `nat` | Nature |
| `arc` | Arcana | `prc` | Perception |
| `ath` | Athletics | `prf` | Performance |
| `dec` | Deception | `per` | Persuasion |
| `his` | History | `rel` | Religion |
| `ins` | Insight | `slt` | Sleight of Hand |
| `itm` | Intimidation | `ste` | Stealth |
| `inv` | Investigation | `sur` | Survival |

**Example roll-skill command:**
```json
{ "type": "roll-skill", "id": "uuid", "params": { "actorId": "abc123", "skill": "ste", "showInChat": true } }
```

**roll-save params:**
- `actorId` - Actor ID to roll for
- `ability` - Ability key: `str`, `dex`, `con`, `int`, `wis`, `cha`
- `showInChat` - Show result in Foundry chat (default: false)

**Example roll-save command:**
```json
{ "type": "roll-save", "id": "uuid", "params": { "actorId": "abc123", "ability": "dex", "showInChat": true } }
```

**roll-ability params:**
- `actorId` - Actor ID to roll for
- `ability` - Ability key: `str`, `dex`, `con`, `int`, `wis`, `cha`
- `showInChat` - Show result in Foundry chat (default: false)

**Example roll-ability command:**
```json
{ "type": "roll-ability", "id": "uuid", "params": { "actorId": "abc123", "ability": "int", "showInChat": true } }
```

**roll-attack params:**
- `actorId` - Actor ID to roll for
- `itemId` - Weapon/spell item ID (get from actor's items list)
- `advantage` - Roll with advantage (default: false)
- `disadvantage` - Roll with disadvantage (default: false)
- `showInChat` - Show result in Foundry chat (default: false)

**Example roll-attack command:**
```json
{ "type": "roll-attack", "id": "uuid", "params": { "actorId": "abc123", "itemId": "weapon456", "advantage": true, "showInChat": true } }
```

**roll-damage params:**
- `actorId` - Actor ID to roll for
- `itemId` - Weapon/spell item ID (same as roll-attack)
- `critical` - Roll critical damage with doubled dice (default: false)
- `showInChat` - Show result in Foundry chat (default: false)

**Example roll-damage command:**
```json
{ "type": "roll-damage", "id": "uuid", "params": { "actorId": "abc123", "itemId": "weapon456", "critical": true, "showInChat": true } }
```

**Example response:**
```json
{ "id": "uuid", "success": true, "data": { "total": 14, "formula": "1d20 + 3", "dice": [{"type": "d20", "count": 1, "results": [11]}] } }
```

### Journal Commands

Commands for creating, editing, and deleting journal entries and pages. Perfect for AI-generated session notes, NPC descriptions, and quest logs.

**create-journal params:**
- `name` - Journal entry name (required)
- `folder` - Folder ID to place journal in (optional)
- `content` - Initial page content as HTML (optional)
- `pageType` - Page type: `text`, `image`, or `video` (default: `text`)

**Example create-journal command:**
```json
{ "type": "create-journal", "id": "uuid", "params": { "name": "Session 5 Notes", "content": "<h2>The Dragon's Lair</h2><p>The party entered the cave...</p>" } }
```

**Response:**
```json
{ "id": "uuid", "success": true, "data": { "id": "abc123", "name": "Session 5 Notes", "folder": null, "pages": [{"id": "page1", "name": "Session 5 Notes", "type": "text"}] } }
```

**update-journal params:**
- `journalId` - Journal ID to update (required)
- `name` - New journal name (optional)
- `folder` - New folder ID (optional)

**delete-journal params:**
- `journalId` - Journal ID to delete (required)

**create-journal-page params:**
- `journalId` - Parent journal ID (required)
- `name` - Page name (required)
- `type` - Page type: `text`, `image`, or `video` (default: `text`)
- `content` - Page content as HTML (optional, for text pages)

**Example create-journal-page command:**
```json
{ "type": "create-journal-page", "id": "uuid", "params": { "journalId": "abc123", "name": "NPCs", "content": "<p>Bartender: Grok the Half-Orc</p>" } }
```

**update-journal-page params:**
- `journalId` - Parent journal ID (required)
- `pageId` - Page ID to update (required)
- `name` - New page name (optional)
- `content` - New content as HTML (optional)

**delete-journal-page params:**
- `journalId` - Parent journal ID (required)
- `pageId` - Page ID to delete (required)

### Combat Commands

Commands for managing combat encounters. Create combat trackers, add combatants, and control initiative order.

**create-combat params:**
- `sceneId` - Scene ID to create combat in (optional, defaults to active scene)
- `activate` - Make this the active combat (default: false)

**Example create-combat command:**
```json
{ "type": "create-combat", "id": "uuid", "params": { "activate": true } }
```

**Response:**
```json
{ "id": "uuid", "success": true, "data": { "id": "combat123", "round": 0, "turn": 0, "started": false, "combatants": [], "current": null } }
```

**add-combatant params:**
- `actorId` - Actor ID to add as combatant (required)
- `combatId` - Combat ID to add to (optional, defaults to active combat)
- `tokenId` - Token ID for the combatant (optional)
- `initiative` - Pre-set initiative value (optional)
- `hidden` - Hide combatant from players (default: false)

**Example add-combatant command:**
```json
{ "type": "add-combatant", "id": "uuid", "params": { "actorId": "actor123", "initiative": 15, "hidden": false } }
```

**Response:**
```json
{ "id": "uuid", "success": true, "data": { "id": "combatant456", "actorId": "actor123", "tokenId": null, "name": "Goblin", "img": "icons/goblin.png", "initiative": 15, "defeated": false, "hidden": false } }
```

## License

MIT
