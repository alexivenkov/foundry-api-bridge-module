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
| `remove-combatant` | `{ combatantId, combatId? }` | Remove combatant from combat |
| `start-combat` | `{ combatId? }` | Start combat (begin round 1) |
| `end-combat` | `{ combatId? }` | End and delete combat |
| `next-turn` | `{ combatId? }` | Advance to next turn |
| `previous-turn` | `{ combatId? }` | Go back to previous turn |
| `get-combat-state` | `{ combatId? }` | Get current combat state |
| `roll-initiative` | `{ combatantIds, combatId?, formula? }` | Roll initiative for specific combatants |
| `set-initiative` | `{ combatantId, initiative, combatId? }` | Manually set initiative value |
| `roll-all-initiative` | `{ combatId?, formula?, npcsOnly? }` | Roll initiative for all combatants |
| `update-combatant` | `{ combatantId, combatId?, initiative?, defeated?, hidden? }` | Update combatant properties |
| `set-combatant-defeated` | `{ combatantId, defeated, combatId? }` | Set combatant defeated status |
| `toggle-combatant-visibility` | `{ combatantId, combatId? }` | Toggle combatant visibility |
| `create-token` | `{ actorId, x, y, sceneId?, hidden?, elevation?, rotation?, scale? }` | Create token on scene |
| `delete-token` | `{ tokenId, sceneId? }` | Delete token from scene |
| `move-token` | `{ tokenId, x, y, sceneId?, elevation?, rotation?, animate? }` | Move token to new position |
| `update-token` | `{ tokenId, sceneId?, hidden?, elevation?, rotation?, scale?, name?, displayName?, disposition?, lockRotation? }` | Update token properties |
| `get-scene-tokens` | `{ sceneId? }` | Get all tokens from scene |

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

**remove-combatant params:**
- `combatantId` - Combatant ID to remove (required)
- `combatId` - Combat ID (optional, defaults to active combat)

**Example remove-combatant command:**
```json
{ "type": "remove-combatant", "id": "uuid", "params": { "combatantId": "combatant456" } }
```

**start-combat params:**
- `combatId` - Combat ID (optional, defaults to active combat)

Starts the combat, setting round to 1 and turn to 0.

**Example start-combat command:**
```json
{ "type": "start-combat", "id": "uuid", "params": {} }
```

**Response:**
```json
{ "id": "uuid", "success": true, "data": { "id": "combat123", "round": 1, "turn": 0, "started": true, "combatants": [...], "current": {...} } }
```

**end-combat params:**
- `combatId` - Combat ID (optional, defaults to active combat)

Ends and deletes the combat encounter.

**Example end-combat command:**
```json
{ "type": "end-combat", "id": "uuid", "params": {} }
```

**next-turn / previous-turn params:**
- `combatId` - Combat ID (optional, defaults to active combat)

Advances or retreats the turn order. Combat must be started first.

**Example next-turn command:**
```json
{ "type": "next-turn", "id": "uuid", "params": {} }
```

**get-combat-state params:**
- `combatId` - Combat ID (optional, defaults to active combat)

Returns the current state of the combat including all combatants.

**Example get-combat-state command:**
```json
{ "type": "get-combat-state", "id": "uuid", "params": {} }
```

**Response:**
```json
{
  "id": "uuid",
  "success": true,
  "data": {
    "id": "combat123",
    "round": 2,
    "turn": 3,
    "started": true,
    "combatants": [
      { "id": "c1", "actorId": "a1", "tokenId": "t1", "name": "Fighter", "img": "...", "initiative": 18, "defeated": false, "hidden": false },
      { "id": "c2", "actorId": "a2", "tokenId": "t2", "name": "Goblin", "img": "...", "initiative": 12, "defeated": false, "hidden": false }
    ],
    "current": { "id": "c2", "actorId": "a2", "tokenId": "t2", "name": "Goblin", "img": "...", "initiative": 12, "defeated": false, "hidden": false }
  }
}
```

### Initiative Commands

Commands for rolling and managing initiative values.

**roll-initiative params:**
- `combatantIds` - Array of combatant IDs to roll initiative for (required)
- `combatId` - Combat ID (optional, defaults to active combat)
- `formula` - Custom initiative formula (optional, uses system default if not provided)

**Example roll-initiative command:**
```json
{ "type": "roll-initiative", "id": "uuid", "params": { "combatantIds": ["combatant1", "combatant2"] } }
```

**Response:**
```json
{ "id": "uuid", "success": true, "data": { "results": [{ "combatantId": "combatant1", "name": "Fighter", "initiative": 18 }, { "combatantId": "combatant2", "name": "Wizard", "initiative": 12 }] } }
```

**set-initiative params:**
- `combatantId` - Combatant ID to set initiative for (required)
- `initiative` - Initiative value to set (required)
- `combatId` - Combat ID (optional, defaults to active combat)

**Example set-initiative command:**
```json
{ "type": "set-initiative", "id": "uuid", "params": { "combatantId": "combatant1", "initiative": 20 } }
```

**roll-all-initiative params:**
- `combatId` - Combat ID (optional, defaults to active combat)
- `formula` - Custom initiative formula (optional, uses system default if not provided)
- `npcsOnly` - Roll only for NPC combatants (default: false)

**Example roll-all-initiative command:**
```json
{ "type": "roll-all-initiative", "id": "uuid", "params": { "npcsOnly": true } }
```

**Response:**
```json
{ "id": "uuid", "success": true, "data": { "results": [{ "combatantId": "c1", "name": "Goblin", "initiative": 14 }, { "combatantId": "c2", "name": "Orc", "initiative": 8 }] } }
```

### Combatant Update Commands

Commands for updating combatant properties like defeated status and visibility.

**update-combatant params:**
- `combatantId` - Combatant ID to update (required)
- `combatId` - Combat ID (optional, defaults to active combat)
- `initiative` - New initiative value (optional)
- `defeated` - Set defeated status (optional)
- `hidden` - Set visibility status (optional)

**Example update-combatant command:**
```json
{ "type": "update-combatant", "id": "uuid", "params": { "combatantId": "c1", "defeated": true, "initiative": 10 } }
```

**set-combatant-defeated params:**
- `combatantId` - Combatant ID to update (required)
- `defeated` - Set defeated status (required)
- `combatId` - Combat ID (optional, defaults to active combat)

**Example set-combatant-defeated command:**
```json
{ "type": "set-combatant-defeated", "id": "uuid", "params": { "combatantId": "c1", "defeated": true } }
```

**toggle-combatant-visibility params:**
- `combatantId` - Combatant ID to toggle visibility (required)
- `combatId` - Combat ID (optional, defaults to active combat)

Toggles the hidden status of a combatant. If visible, makes hidden. If hidden, makes visible.

**Example toggle-combatant-visibility command:**
```json
{ "type": "toggle-combatant-visibility", "id": "uuid", "params": { "combatantId": "c1" } }
```

### Token Commands

Commands for managing tokens on scenes. Create, move, update, and delete tokens programmatically.

**create-token params:**
- `actorId` - Actor ID to create token for (required)
- `x` - X coordinate on the scene (required)
- `y` - Y coordinate on the scene (required)
- `sceneId` - Scene ID to create token in (optional, defaults to active scene)
- `hidden` - Token visibility to players (default: false)
- `elevation` - Token elevation in units (optional)
- `rotation` - Token rotation in degrees (optional)
- `scale` - Token scale multiplier (optional)

**Example create-token command:**
```json
{ "type": "create-token", "id": "uuid", "params": { "actorId": "actor123", "x": 500, "y": 300, "hidden": true } }
```

**Response:**
```json
{ "id": "uuid", "success": true, "data": { "id": "token123", "name": "Goblin", "actorId": "actor123", "x": 500, "y": 300, "elevation": 0, "rotation": 0, "hidden": true, "img": "icons/goblin.png", "disposition": 1 } }
```

**delete-token params:**
- `tokenId` - Token ID to delete (required)
- `sceneId` - Scene ID (optional, defaults to active scene)

**Example delete-token command:**
```json
{ "type": "delete-token", "id": "uuid", "params": { "tokenId": "token123" } }
```

**move-token params:**
- `tokenId` - Token ID to move (required)
- `x` - New X coordinate (required)
- `y` - New Y coordinate (required)
- `sceneId` - Scene ID (optional, defaults to active scene)
- `elevation` - New elevation (optional)
- `rotation` - New rotation in degrees (optional)
- `animate` - Animate the movement (default: true)

**Example move-token command:**
```json
{ "type": "move-token", "id": "uuid", "params": { "tokenId": "token123", "x": 600, "y": 400, "animate": true } }
```

**update-token params:**
- `tokenId` - Token ID to update (required)
- `sceneId` - Scene ID (optional, defaults to active scene)
- `hidden` - Set visibility (optional)
- `elevation` - Set elevation (optional)
- `rotation` - Set rotation in degrees (optional)
- `scale` - Set scale multiplier (optional)
- `name` - Set token name (optional)
- `displayName` - Set name display mode (optional)
- `disposition` - Set disposition: -1 (hostile), 0 (neutral), 1 (friendly) (optional)
- `lockRotation` - Lock rotation (optional)

**Example update-token command:**
```json
{ "type": "update-token", "id": "uuid", "params": { "tokenId": "token123", "hidden": false, "disposition": -1 } }
```

**get-scene-tokens params:**
- `sceneId` - Scene ID (optional, defaults to active scene)

Returns all tokens on the specified scene.

**Example get-scene-tokens command:**
```json
{ "type": "get-scene-tokens", "id": "uuid", "params": {} }
```

**Response:**
```json
{
  "id": "uuid",
  "success": true,
  "data": {
    "sceneId": "scene123",
    "sceneName": "Dungeon Level 1",
    "tokens": [
      { "id": "t1", "name": "Fighter", "actorId": "a1", "x": 500, "y": 300, "elevation": 0, "rotation": 0, "hidden": false, "img": "icons/fighter.png", "disposition": 1 },
      { "id": "t2", "name": "Goblin", "actorId": "a2", "x": 700, "y": 400, "elevation": 0, "rotation": 0, "hidden": false, "img": "icons/goblin.png", "disposition": -1 }
    ]
  }
}
```

## License

MIT
