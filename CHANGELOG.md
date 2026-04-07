# Changelog

All notable changes to this project will be documented in this file.

## [7.5.1] - 2026-04-07

### Fixed
- **`move-token` crash on long pathfinding routes** — "Cannot read properties of undefined (reading 'update')"
  - Root cause: `token.update()` return value was unreliable during sequential waypoint moves
  - Fix: re-fetch token from scene collection by ID after each waypoint update
  - Token now visually moves through each waypoint with animation
  - Tested on Cragmaw Castle: cross-map diagonal routes work smoothly

## [7.5.0] - 2026-04-07

### Added
- **Grid A* pathfinding in `move-token`** — tokens automatically navigate around walls
  - When direct path is blocked by walls, module finds an alternate route using A* on the grid
  - Uses Foundry collision API (`CONFIG.Canvas.polygonBackends.move.testCollision()`)
  - 8-directional movement (orthogonal + diagonal)
  - Tokens animate through each waypoint sequentially
  - Returns error `"Path blocked — no valid route to destination"` if completely enclosed
  - Graceful degradation: direct move when collision backend unavailable (v12 without canvas)
- New: `GridPathfinder.ts` — pure A* function, no Foundry globals dependency, fully testable

### Changed
- `move-token` no longer teleports tokens through walls
- API contract unchanged — same params, same result type, server needs no changes

### Technical
- 555 tests (16 new: 11 pathfinder + 5 handler)
- Chebyshev heuristic, maxNodes=2500 safety limit
- Elevation and rotation applied to final waypoint only

## [7.4.0] - 2026-04-07

### Added
- **ASCII tactical map in `get-scene`** — always included in response
  - Wall collision detection via `CONFIG.Canvas.polygonBackends.move.testCollision()`
  - Walls (`|` `---`), doors (`D`), open doors (`d`), locked doors (`L`), secret doors (`?`)
  - Numbered token IDs with multi-cell support (2x2, 3x3)
  - Legend with token name, size, HP, grid position
  - Coordinate axes for precise reference
- **Optional screenshot in `get-scene`** — `includeScreenshot: true` param
  - Returns `screenshot` field with base64 WebP image when canvas is available
  - Graceful degradation: omitted when canvas not ready

### Changed
- `GetSceneParams` now accepts `includeScreenshot?: boolean`
- `SceneDetailResult` now includes `asciiMap: string` and optional `screenshot: SceneScreenshot`

### Technical
- 539 tests (15 new for ASCII map generator)
- New: `AsciiMapGenerator.ts` — pure function, fully testable without Foundry globals

## [7.3.1] - 2026-04-06

### Fixed
- **`capture-scene`** — fixed black/empty screenshots
  - PIXI `extract.base64()` failed with "ICanvas.toBlob failed!" due to WebGL buffer issues
  - PIXI `extract.canvas()` returned empty canvas (WebGL texImage2D out of range)
  - Solution: `renderer.render(stage)` + `view.toDataURL()` — forces a fresh render then captures the WebGL canvas before buffer clear
  - Verified in live Foundry VTT with actual scene (Cragmaw Castle, 6400x4600)

## [7.3.0] - 2026-04-06

### Added
- **`capture-scene`** — live canvas screenshot for AI DM vision
  - Returns base64 WebP image of the current canvas (map, tokens, lighting, tiles)
  - Graceful degradation: returns `"Canvas not ready"` error when GM's browser tab is in background
  - Server embeds screenshot into existing `get-scene` response for AI context
  - WebP format with 0.8 quality for reasonable payload size

### Technical
- 522 tests (8 new)
- Uses PIXI.js `canvas.app.renderer.extract.base64(canvas.stage)`
- Strips `data:image/webp;base64,` prefix — returns raw base64

## [7.2.0] - 2026-04-05

### Added
- **Roll Table commands** — full CRUD + roll + reset for Foundry Roll Tables
  - `list-roll-tables` — list all tables with summary (total/drawn counts)
  - `get-roll-table` — full table with all results
  - `roll-on-table` — roll dice and get result (uses `table.draw()`, respects replacement)
  - `reset-table` — reset all drawn results back to available
  - `create-roll-table` — create table with optional initial results
  - `update-roll-table` — update table metadata
  - `delete-roll-table` — delete table
- New handler group: `src/commands/handlers/table/`
- v12/v13 compatibility: handles both `text`/`name` and numeric/string `type` fields

### Technical
- 514 tests (36 new)

## [7.1.0] - 2026-04-04

### Changed
- **`get-actor`**: items now include full `system` data (via `toObject(false).system`) — descriptions, damage formulas, range, etc.
- **`get-actor-items`**: `ItemDetailSummary` enriched with `description` (HTML string), `damage` (object or null), `range` (object or null)
- **`get-actor`**: `ItemSummary` type now includes `system: Record<string, unknown>`

### Technical
- 478 tests
- Actor system data uses `getRollData()` (computed fields including `abilities.*.save`)
- Item system data uses `toObject(false).system` (raw data including descriptions)

## [7.0.0] - 2026-04-03

### Breaking Changes
- **Removed push mechanism entirely** — module no longer sends world data to the server via HTTP
- Removed periodic world data sync (UpdateLoop)
- Removed compendium auto-upload on connect
- Removed REST API client (ApiClient)
- Removed `window.FoundryAPIBridge` global API
- Removed `Server URL` setting (only WebSocket URL and API Key remain)
- Removed config sections: `apiServer`, `features`, `compendium`
- Simplified config to: `webSocket` + `logging` only

### How it works now
Module connects to Gateway via WebSocket and responds to incoming commands (pull architecture). All data is requested on demand by the server — no outbound HTTP, no timers, no periodic sync.

### Removed
- `src/api/` — ApiClient, SessionInfo, ApiError
- `src/core/` — UpdateLoop with backoff logic
- `src/collectors/` — WorldDataCollector, CompendiumCollector
- `src/config/loader.ts` — config file migration
- `src/config/merger.ts` — deep merge utility
- `src/utils/` — validation helpers
- `pauseGame` hook (no loop to pause)
- UI: API Server Settings, Features toggles, Compendia Auto-Load selector
- Types: `WorldData`, `ActorData`, `SceneData`, `SessionInfo`, `Window.FoundryAPIBridge`

### Technical
- 476 tests (from 572 — removed 96 push-related tests)
- Bundle size: 70KB (down from 94KB, -25%)
- Config form: WebSocket + Logging only

## [6.13.0] - 2026-04-03

### Added
- **Pull-architecture commands (Batch 2)** — completes full data coverage for pull-based architecture
  - `get-journals` — list all journals with pages (text, markdown content)
  - `get-journal` — single journal by ID with full page content
  - `get-items` — list all world items with system data
  - `get-item` — single world item by ID
  - `get-compendiums` — list all compendium packs with full metadata
  - `get-compendium` — load all documents from a compendium pack (async, supports Actor items and JournalEntry pages)

### Technical
- 572 tests (40 new)
- All pull data formats are 1:1 with push (`POST /update`) format
- `get-compendium` is the only async handler (calls `pack.getDocuments()`)
- After server integrates Batch 2, push mechanism can be fully retired

## [6.12.0] - 2026-04-03

### Added
- **Pull-architecture commands (Batch 1)** — Gateway can now request data from Foundry on demand via WebSocket instead of relying solely on periodic push
  - `get-world-info` — world metadata, entity counts, compendium pack list
  - `get-actors` — list all actors (id, name, type, img)
  - `get-actor` — full actor data by ID (system data via getRollData, item summaries)
- New handler group: `src/commands/handlers/world/`

### Changed
- `ActorDetailResult` type changed from dnd5e-specific (hp, ac, abilities, skills) to system-agnostic (`system: Record<string, unknown>`) matching the push format
- `get-actors` result type changed from `{ actors: ActorSummary[] }` to flat `ActorSummary[]` matching server contract
- Removed unused types: `ActorListResult`, `AbilityScore`, `SkillInfo`

### Technical
- 532 tests (24 new)
- Data format from `get-actor` is identical to `WorldData.actors[]` from push (uses same `getRollData()`)
- `get-world-info` data is identical to `WorldData.{ world, counts, compendiumMeta }` from push
- Existing `get-scenes-list` covers `list-scenes` needs — no duplication

## [6.8.0] - 2026-03-30

### Changed
- **activate-item now returns full results** from item usage
  - `rolls[]` - dice results from Foundry (attack rolls, damage, etc.)
  - `chatMessageId` - reference to created chat message
  - `workflow` - full Midi-QOL automation results when Midi-QOL is installed
- Midi-QOL workflow data includes: `attackTotal`, `damageTotal`, `isCritical`, `isFumble`, `hitTargetIds`, `saveTargetIds`, `failedSaveTargetIds`
- Auto-detects Midi-QOL presence via `game.modules.get('midi-qol')` — zero overhead when not installed

### Technical
- Listens for `midi-qol.RollComplete` hook with 5s timeout safety
- 481 tests

## [6.7.0] - 2026-03-28

### Added
- **`activate-item` command** - Native item activation with full automation module support
  - Calls `item.use()` / `activity.use()` without suppressing hooks or dialogs
  - Enables Midi-QOL and other automation modules to intercept and run full pipeline
  - `targetTokenIds` parameter for programmatic targeting before activation
  - Clears existing targets and sets new ones via `canvas.tokens.get().setTarget()`
- Supports `activityId` and `activityType` for selecting specific item activities

### Technical
- New handler: `src/commands/handlers/item/ActivateItemHandler.ts`
- Targeting types added to `itemTypes.ts`: `FoundryTargetToken`, `FoundryCanvasTokensLayer`, `FoundryUser`
- 474 tests

## [6.6.0] - 2026-03-27

### Added
- **Scene lights** - Light sources with bright/dim radius, color, angle, wall interaction
- **Scene tiles** - Decorative tile images with position, size, elevation, rotation
- **Scene drawings** - Shapes (rectangle, ellipse, polygon, freehand) with fill/stroke colors and text
- **Scene regions** - Named zones with geometric shapes (Foundry v13)
- **Token grid positions** - `gridX`/`gridY` computed from pixel coordinates and grid size

### Changed
- `get-scene` result: `tokenCount` replaced with full `tokens[]` array including grid coordinates, actorId, disposition, hidden
- REST `SceneData` extended with `lights[]`, `tiles[]`, `drawings[]`, `regions[]`
- `pixelToGrid()` utility for coordinate conversion

### Technical
- 460 tests

## [6.5.0] - 2026-03-26

### Added
- **Scene management commands** via WebSocket
  - `get-scene` - Get detailed scene info (grid, darkness, notes, walls, token count)
  - `get-scenes-list` - List all scenes (id, name, active, img)
  - `activate-scene` - Switch the active scene
- **Enriched scene data** in REST outbound
  - `grid` - Grid size, type (square/hex), units, distance per cell
  - `darkness` - Scene darkness level (0-1)
  - `notes[]` - Map pins with text, label, linked journal entry
  - `walls[]` - Wall segments with movement/vision blocking and door types
- Scene handler group: `src/commands/handlers/scene/`

### Technical
- New types: `SceneDetailResult`, `SceneSummaryResult`, `SceneGridResult`, `SceneNoteResult`, `SceneWallResult`
- `sceneTypes.ts` with Foundry interfaces and mapping functions
- 452 tests

## [4.11.0] - 2025-12-06

### Changed
- 📁 Reorganized journal handlers into dedicated folder (`src/commands/handlers/journal/`)
- Clean handler structure: only `RollDiceHandler` remains in root, all domain handlers organized by folder

### Technical
- Moved 6 journal handlers to `src/commands/handlers/journal/`
- Handler folders: `actor/`, `combat/`, `journal/`, `token/`
- Shared types per domain: `actorTypes.ts`, `combatTypes.ts`, `journalTypes.ts`, `tokenTypes.ts`

## [4.10.0] - 2025-12-05

### Added
- 🎭 **Actor CRUD commands** - Create, update, and delete actors via WebSocket
  - `create-actor` - Create new actor (name, type, optional: folder, img, system data)
  - `create-actor-from-compendium` - Import actor from compendium pack (packId, actorId, optional: name override, folder)
  - `update-actor` - Update actor properties (name, img, folder, system data)
  - `delete-actor` - Delete actor from world
- 📁 Actor handlers in separate folder (`src/commands/handlers/actor/`)
- Shared actor types and helper functions (`actorTypes.ts`)

### Changed
- Reorganized actor-related handlers into dedicated folder structure
- Moved roll handlers (RollSkill, RollSave, RollAbility, RollAttack, RollDamage) to actor folder
- Test coverage increased to 302 tests (24 new tests for actor CRUD)

### Technical
- 4 new handlers in `src/commands/handlers/actor/`
- Foundry Actor API integration: Actor.create, actor.update, actor.delete, pack.getDocument
- ActorResult includes id, uuid, name, type, img, folder
- CreateActorFromCompendium validates pack type and copies actor data
- DeleteResult returns { deleted: true }

## [4.9.0] - 2025-12-05

### Added
- 🎭 **Token commands** - Full token management on scenes via WebSocket
  - `create-token` - Create token on scene (actorId, x, y, optional: hidden, elevation, rotation, scale)
  - `delete-token` - Delete token from scene
  - `move-token` - Move token to new position (x, y, optional: elevation, rotation, animate)
  - `update-token` - Update token properties (hidden, elevation, rotation, scale, name, displayName, disposition, lockRotation)
  - `get-scene-tokens` - Get all tokens from scene (active or specific sceneId)
- 📁 Token handlers in separate folder (`src/commands/handlers/token/`)
- Shared token types and helper functions (`tokenTypes.ts`)

### Changed
- Test coverage increased to 278 tests

### Technical
- 5 new handlers in `src/commands/handlers/token/`
- Foundry Token API integration: createEmbeddedDocuments, deleteEmbeddedDocuments, token.update, token.delete
- TokenResult includes id, name, actorId, x, y, elevation, rotation, hidden, img, disposition
- SceneTokensResult returns sceneId, sceneName, tokens array

## [4.8.0] - 2025-12-04

### Added
- ⚔️ **Combat Tracker commands** - Full combat encounter management via WebSocket
  - `create-combat` - Create new combat encounter (optional scene, activate)
  - `add-combatant` - Add combatant to combat (by actorId/tokenId, with initiative)
  - `remove-combatant` - Remove combatant from combat
  - `start-combat` - Start combat (begin round 1)
  - `end-combat` - End and delete combat encounter
  - `next-turn` - Advance to next turn in initiative order
  - `previous-turn` - Go back to previous turn
  - `get-combat-state` - Get current combat state with all combatants
- 🎲 **Initiative commands** - Roll and manage initiative values
  - `roll-initiative` - Roll initiative for specific combatants (with optional custom formula)
  - `set-initiative` - Manually set initiative value for a combatant
  - `roll-all-initiative` - Roll initiative for all combatants (or NPCs only)
- 🎭 **Combatant update commands** - Update combatant properties
  - `update-combatant` - Update combatant properties (initiative, defeated, hidden)
  - `set-combatant-defeated` - Set combatant defeated status
  - `toggle-combatant-visibility` - Toggle combatant visibility for players
- 📁 Combat handlers in separate folder (`src/commands/handlers/combat/`)
- Shared combat types and helper functions (`combatTypes.ts`)

### Changed
- Test coverage increased to 256 tests

### Technical
- 14 new handlers in `src/commands/handlers/combat/`
- Foundry Combat API integration: startCombat, nextTurn, previousTurn, endCombat, rollInitiative, rollAll, rollNPC, setInitiative, combatant.update
- CombatResult includes round, turn, started status, combatants array, current combatant
- InitiativeRollResult returns array of results with combatantId, name, initiative

## [4.5.0] - 2025-12-03

### Added
- 📓 **Journal commands** - Full CRUD for journal entries and pages via WebSocket
  - `create-journal`, `update-journal`, `delete-journal`
  - `create-journal-page`, `update-journal-page`, `delete-journal-page`
- Support for text, image, and video page types
- Folder organization for journals

### Changed
- Test coverage increased to 183 tests

## [4.0.0] - 2025-12-03

### Added
- 🔌 **WebSocket bidirectional communication** - Execute commands in Foundry from external server
  - Auto-reconnecting WebSocket client with configurable retry logic
  - Type-safe command router with handler registration
  - `roll-dice` command for dice rolls via Foundry Roll API
- 🎲 **Dice rolling via WebSocket**
  - Support for any Foundry dice formula (`1d20+5`, `2d6kh1`, etc.)
  - Optional chat output with flavor text
  - Critical/fumble detection on d20 rolls
  - Detailed dice results (individual die values)
- ⚙️ **WebSocket configuration** in settings UI
  - Enable/disable WebSocket
  - Server URL configuration
  - Reconnect interval and max attempts
- 📁 **Import path aliases** - Clean imports with `@/` prefix
- 📄 **CLAUDE.md** - AI assistant guidance for codebase

### Changed
- Architecture extended for bidirectional communication (REST out, WebSocket in)
- Test coverage increased to 111 tests
- `DeepPartial<T>` type for flexible partial configurations

### Technical
- `src/transport/WebSocketClient.ts` - WebSocket with auto-reconnect and DI for testing
- `src/commands/CommandRouter.ts` - Type-safe command dispatch
- `src/commands/handlers/RollDiceHandler.ts` - Foundry Roll API integration
- `src/commands/types.ts` - Command/Response type definitions
- `tsconfig.json` - Path aliases (`@/*` → `src/*`)

## [3.1.0] - 2025-11-12

### Added
- ✨ **Premium UI Compendium Selection** - Beautiful, user-friendly interface for selecting compendia
  - 🔍 **Live search/filter** - Instant search across name, ID, and type
  - ✅ **Bulk actions** - "Select All" and "Deselect All" buttons (respects search filter)
  - 📊 **Live counter** - Shows "X of Y selected" in real-time
  - 🎨 **Rich compendium cards** - Icons, type badges, and document counts
  - 🏷️ **Color-coded badges** - Visual distinction by document type (Actor/Item/Journal/etc.)
  - 📈 **Document counts** - See how many documents each compendium contains
  - 🎯 **Smart sorting** - Checked items appear first, then alphabetically
  - ✨ **Smooth animations** - Hover effects and transitions
  - ♿ **Accessibility** - Keyboard navigation and screen reader support
- 📋 Detailed compendium setup guide (COMPENDIUM_SETUP.md)
- 📖 Comprehensive UI improvements guide (UI_IMPROVEMENTS.md)
- 🎨 Professional CSS styling with Foundry VTT design language

### Changed
- Settings form now displays available compendia with full metadata
- Compendium selection automatically triggers auto-load on save
- Improved user feedback with notifications after configuration save
- Enhanced visual hierarchy and spacing throughout the form

### Fixed
- **Empty compendium list by default** - Users can now easily select compendia through UI instead of console commands
- Improved readability with monospace IDs and clear labels

## [3.0.0] - 2024-11-08

### Added
- ✨ Complete TypeScript rewrite with strict type checking (no `any` types)
- ⚙️ UI-based configuration via Foundry settings menu
- 🎨 Beautiful configuration form with proper styling
- 📦 Modern build system with Vite
- 🧪 Comprehensive unit test coverage (77 tests)
- 🔍 ESLint 9 with strict TypeScript rules
- 📝 JSON Schema validation for configuration
- 🎯 Modular architecture with clean separation of concerns

### Changed
- Configuration now managed via Foundry UI instead of manual JSON editing
- Settings stored in Foundry database instead of config.json file
- Updated to work with Foundry VTT v11-13
- Improved error handling and logging

### Technical
- TypeScript 5.6 with strictest possible settings
- Vite 5.4 for fast builds
- Jest 29 for testing
- 77 unit tests with good coverage
- Clean architecture: collectors, API client, config manager, settings manager

## [2.2.0] - 2024-11-06

### Added
- AUTO-LOAD functionality for compendia
- Configurable auto-load list in config.json

## [2.1.0] - 2024-11-06

### Added
- Compendium support
- Load and send compendium data to API server

## [2.0.0] - Initial Release

### Added
- Core world data collection (journals, actors, scenes, items)
- Periodic updates to external API server
- Basic configuration via config.json
