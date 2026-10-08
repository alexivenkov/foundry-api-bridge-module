# Supported commands

164 wire commands in Foundry API Bridge 8.13.0. Names are what the server sends over the wire; MCP tools and REST routes map onto them. The list is taken from the handlers registered in `src/main.ts`.

Each command runs in the GM's browser session with GM permissions. Access follows the Patreon tier of the key (see [Tiers](../README.md#tiers) in the README).

## Wire protocol

```typescript
// Command (server → Foundry)
{ id: string, type: string, params: object }

// Response (Foundry → server)
{ id: string, success: boolean, data?: object, error?: string }
```

## Dice, rolls & chat

`roll-dice` (up to 1000 dice per formula), `roll-ability`, `roll-skill`, `roll-save`, `roll-attack`, `roll-damage`, `roll-perception`, `send-chat-message`, `get-chat-messages`, `update-chat-message`, `delete-chat-message`, `clear-chat`, `export-chat`

The bare roll commands are legacy aliases of the `dnd5e/*` commands below and require the D&D 5e system.

## Actors

`get-actors`, `get-actor`, `filter-actors`, `create-actor`, `create-actor-from-compendium`, `update-actor`, `delete-actor`

## Items & inventory

`get-items`, `get-item`, `filter-items`, `create-item`, `create-item-from-compendium`, `update-item`, `delete-item`, `get-actor-items`, `add-item-to-actor`, `add-item-from-compendium`, `update-actor-item`, `delete-actor-item`, `use-item`, `activate-item`

`use-item` and `activate-item` are legacy aliases of `dnd5e/use-item` and `dnd5e/activate-item`.

## Active effects & status conditions

`get-actor-effects`, `add-actor-effect`, `update-actor-effect`, `remove-actor-effect`, `toggle-actor-status`

## Combat

`create-combat`, `delete-combat`, `start-combat`, `end-combat`, `next-turn`, `previous-turn`, `set-turn`, `add-combatant`, `remove-combatant`, `update-combatant`, `roll-initiative`, `roll-all-initiative`, `set-initiative`, `get-combat-state`, `get-combat-turn-context`, `set-combatant-defeated`, `toggle-combatant-visibility`

## Tokens

`create-token`, `delete-token`, `move-token`, `update-token`, `get-token`, `get-token-by-actor`, `get-scene-tokens`, `get-tokens-in-range`, `set-token-target`, `clear-targets`

`move-token` uses A* pathfinding with collision detection: tokens walk around walls and obstacles instead of teleporting, and can open doors along the way.

## Scenes, walls, doors & notes

`get-scene`, `get-scenes-list`, `activate-scene`, `view-scene`, `capture-scene`, `create-scene`, `update-scene`, `delete-scene`, `clone-scene`, `get-walls`, `create-wall`, `update-wall`, `delete-wall`, `set-door-state`, `get-notes`, `create-note`, `update-note`, `delete-note`

`get-scene` and `capture-scene` can return a screenshot of the scene as a base64 WebP image with a coordinate grid overlay for spatial reasoning.

## Journals

`get-journals`, `get-journal`, `create-journal`, `update-journal`, `delete-journal`, `show-journal`, `create-journal-page`, `update-journal-page`, `delete-journal-page`

`get-journals` accepts `light: true` for an index without page text (fast on large worlds); the server uses it for lists and search.

## Folders

`get-folders`, `get-folder`, `create-folder`, `update-folder`, `delete-folder`

## Roll tables

`list-roll-tables`, `get-roll-table`, `create-roll-table`, `update-roll-table`, `delete-roll-table`, `roll-on-table`, `reset-table`

## Macros

`get-macros`, `get-macro`, `create-macro`, `update-macro`, `delete-macro`, `execute-macro`

Script macros require **Allow Script Macros** in the module settings; it is off by default.

## Playlists & sounds

`get-playlists`, `get-playlist`, `play-playlist`, `stop-playlist`, `play-sound-in-playlist`, `stop-sound-in-playlist`, `play-sound-once`, `add-sound-to-playlist`

## Compendiums

`get-compendiums`, `get-compendium`, `get-compendium-index`, `get-compendium-document`, `search-compendium`, `search-compendiums`, `search-compendium-pages`, `import-from-compendium`, `resolve-uuid`

`get-compendium` accepts optional `types` and `ids` for server-side selection. `search-compendium-pages` is a full-text search over journal pack pages and returns snippets with page UUIDs.

## World, time & UI

`get-world-info`, `get-world-time`, `advance-time`, `set-world-time`, `pause-game`, `resume-game`, `get-pause-state`, `notify`, `pan-canvas`, `ping-location`

## D&D 5e

Require the `dnd5e` system in the world.

`dnd5e/roll-ability`, `dnd5e/roll-skill`, `dnd5e/roll-save`, `dnd5e/roll-attack`, `dnd5e/roll-damage`, `dnd5e/roll-perception`, `dnd5e/use-item`, `dnd5e/activate-item`, `dnd5e/filter-compendium-actors`, `dnd5e/filter-compendium-items`

`dnd5e/roll-ability`, `dnd5e/roll-skill`, `dnd5e/roll-save` and `dnd5e/roll-perception` take `actorId`, the `ability` or `skill` key, optional `showInChat` and, since 8.13.0, optional `advantage` / `disadvantage` booleans that roll `2d20kh` / `2d20kl` instead of `1d20`. Both flags at once are a validation error: `Cannot have both advantage and disadvantage`. `dnd5e/roll-attack` takes the same two flags; `dnd5e/roll-damage` takes `critical`.

`dnd5e/filter-compendium-actors` and `dnd5e/filter-compendium-items` search packs by D&D 5e fields (challenge rating, type, spell level, rarity, …); results carry `packId` and `uuid`.

## Pathfinder 2e

Require the `pf2e` system in the world.

`pf2e/roll-skill`, `pf2e/roll-save`, `pf2e/roll-perception`, `pf2e/list-strikes`, `pf2e/roll-strike`, `pf2e/roll-strike-damage`, `pf2e/cast-spell`, `pf2e/use-consumable`, `pf2e/post-item`, `pf2e/get-conditions`, `pf2e/set-condition`, `pf2e/increase-condition`, `pf2e/decrease-condition`, `pf2e/remove-condition`, `pf2e/filter-compendium-actors`, `pf2e/filter-compendium-items`

`pf2e/filter-compendium-actors` and `pf2e/filter-compendium-items` search packs by Pathfinder 2e fields (level, traits, rarity, …); entries carry `level`, `packId` and `uuid`.

## System mismatch

Calling a `dnd5e/*` or `pf2e/*` command in a world running another system returns:

```
Operation '<command>' is not supported by game system '<world system>'
```
