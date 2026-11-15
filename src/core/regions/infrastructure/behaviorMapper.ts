import {
  CORE_BEHAVIOR_TYPES,
  SURFACE_PLACEMENTS,
  TELEPORT_PLACEMENTS,
  type CoreBehaviorConfig,
  type CoreBehaviorType,
  type RegionBehavior,
  type RegionBehaviorConfig,
  type RegionBehaviorConfigInput,
  type SurfacePlacement,
  type TeleportPlacement
} from '@/core/regions/domain';
import type { FoundryRegionBehaviorSource } from './foundryRegionBehaviorTypes';
import { darknessModeFromCode, darknessModeToCode, textVisibilityFromCode, textVisibilityToCode } from './regionCodes';

// System data of the core behavior types, verified against the type data models of
// Foundry 13.351 and 14.368 (client/data/region-behaviors). Foundry 14 replaced
// teleportToken's single `destination` with `destinations` and stores the UUIDs of
// teleport destinations and toggled behaviors relative to the behavior (`..<id>`).

type Data = Record<string, unknown>;

/** Turns a stored (possibly relative) UUID into an absolute one. */
export type UuidResolver = (uuid: string) => string;

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function record(value: unknown): Data {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Data) : {};
}

function oneOf<T extends string>(choices: readonly T[], value: unknown, fallback: T): T {
  return (choices as readonly unknown[]).includes(value) ? (value as T) : fallback;
}

function isCoreType(type: string): type is CoreBehaviorType {
  return (CORE_BEHAVIOR_TYPES as readonly string[]).includes(type);
}

function difficultiesFrom(value: unknown): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const [action, cost] of Object.entries(record(value))) {
    out[action] = typeof cost === 'number' ? cost : null;
  }
  return out;
}

function teleportFrom(system: Data, resolve: UuidResolver): CoreBehaviorConfig {
  if (!('destinations' in system)) {
    const destination = nullableString(system['destination']);
    return {
      kind: 'teleportToken',
      settings: { destinationUuids: destination !== null ? [resolve(destination)] : [], choice: bool(system['choice']) }
    };
  }
  const dialog = record(system['dialog']);
  const transition = record(system['transition']);
  return {
    kind: 'teleportToken',
    settings: {
      destinationUuids: strings(system['destinations']).map(resolve),
      choice: bool(system['choice']),
      placement: oneOf<TeleportPlacement>(TELEPORT_PLACEMENTS, system['placement'], 'random'),
      snap: bool(system['snap'], true),
      revealed: bool(system['revealed']),
      dialog: { revealed: nullableString(dialog['revealed']), unrevealed: nullableString(dialog['unrevealed']) },
      transition: { type: nullableString(transition['type']), duration: num(transition['duration'], 1500) }
    }
  };
}

function coreConfigFrom(type: CoreBehaviorType, system: Data, resolve: UuidResolver): CoreBehaviorConfig {
  const events = strings(system['events']);
  switch (type) {
    case 'adjustDarknessLevel':
      return {
        kind: type,
        settings: { mode: darknessModeFromCode(system['mode']), modifier: num(system['modifier']) }
      };
    case 'displayScrollingText':
      return {
        kind: type,
        settings: {
          events,
          text: str(system['text']),
          color: str(system['color'], '#ffffff'),
          visibility: textVisibilityFromCode(system['visibility']),
          once: bool(system['once'])
        }
      };
    case 'executeMacro':
      return {
        kind: type,
        settings: { events, macroUuid: nullableString(system['uuid']), everyone: bool(system['everyone']) }
      };
    case 'executeScript':
      return { kind: type, settings: { events, source: str(system['source']) } };
    case 'modifyMovementCost':
      return { kind: type, settings: { difficulties: difficultiesFrom(system['difficulties']) } };
    case 'pauseGame':
      return { kind: type, settings: { once: bool(system['once']) } };
    case 'suppressWeather':
      return { kind: type, settings: {} };
    case 'teleportToken':
      return teleportFrom(system, resolve);
    case 'toggleBehavior':
      return {
        kind: type,
        settings: {
          events,
          enableUuids: strings(system['enable']).map(resolve),
          disableUuids: strings(system['disable']).map(resolve)
        }
      };
    case 'applyActiveEffect':
      return { kind: type, settings: { effectUuids: strings(system['effects']).map(resolve) } };
    case 'changeLevel':
      return { kind: type, settings: { movementActions: strings(system['movementActions']) } };
    case 'defineSurface':
      return {
        kind: type,
        settings: {
          placement: oneOf<SurfacePlacement>(SURFACE_PLACEMENTS, system['placement'], 'bottom'),
          light: bool(system['light'], true),
          move: bool(system['move'], true),
          sight: bool(system['sight'], true),
          sound: bool(system['sound'], true),
          occlusion: bool(system['occlusion'], true),
          exposure: bool(system['exposure']),
          culling: bool(system['culling'])
        }
      };
  }
}

export function toRegionBehavior(source: FoundryRegionBehaviorSource, resolve: UuidResolver): RegionBehavior {
  const system = record(source.system);
  const config: RegionBehaviorConfig = isCoreType(source.type)
    ? coreConfigFrom(source.type, system, resolve)
    : { kind: 'opaque', data: system };
  return { id: source._id, name: source.name, type: source.type, disabled: source.disabled, config };
}

function defined(data: Data): Data {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function copy(values: readonly string[] | undefined): string[] | undefined {
  return values !== undefined ? [...values] : undefined;
}

function nested(value: object | undefined): Data | undefined {
  return value !== undefined ? defined(Object.fromEntries(Object.entries(value))) : undefined;
}

/**
 * The behavior's `system` data for the given settings: only the fields that are set,
 * so the same data serves a create (core defaults fill the rest) and a merge.
 * `extendedTeleport` selects the Foundry 14 teleport fields.
 */
export function toFoundrySystem(config: RegionBehaviorConfigInput, extendedTeleport: boolean): Data {
  switch (config.kind) {
    case 'opaque':
      return { ...config.data };
    case 'adjustDarknessLevel': {
      const { mode, modifier } = config.settings;
      return defined({ mode: mode !== undefined ? darknessModeToCode(mode) : undefined, modifier });
    }
    case 'displayScrollingText': {
      const { events, text, color, visibility, once } = config.settings;
      return defined({
        events: copy(events),
        text,
        color,
        visibility: visibility !== undefined ? textVisibilityToCode(visibility) : undefined,
        once
      });
    }
    case 'executeMacro': {
      const { events, macroUuid, everyone } = config.settings;
      return defined({ events: copy(events), uuid: macroUuid, everyone });
    }
    case 'executeScript':
      return defined({ events: copy(config.settings.events), source: config.settings.source });
    case 'modifyMovementCost':
      return defined({ difficulties: nested(config.settings.difficulties) });
    case 'pauseGame':
      return defined({ once: config.settings.once });
    case 'suppressWeather':
      return {};
    case 'teleportToken': {
      const { destinationUuids, choice, placement, snap, revealed, dialog, transition } = config.settings;
      if (!extendedTeleport) {
        return defined({
          destination: destinationUuids !== undefined ? (destinationUuids[0] ?? null) : undefined,
          choice
        });
      }
      return defined({
        destinations: copy(destinationUuids),
        choice,
        placement,
        snap,
        revealed,
        dialog: nested(dialog),
        transition: nested(transition)
      });
    }
    case 'toggleBehavior': {
      const { events, enableUuids, disableUuids } = config.settings;
      return defined({ events: copy(events), enable: copy(enableUuids), disable: copy(disableUuids) });
    }
    case 'applyActiveEffect':
      return defined({ effects: copy(config.settings.effectUuids) });
    case 'changeLevel':
      return defined({ movementActions: copy(config.settings.movementActions) });
    case 'defineSurface':
      return defined({ ...config.settings });
  }
}
