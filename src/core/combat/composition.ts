import { FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import {
  CombatService,
  CombatantGroupService,
  CombatantService,
  EncounterService,
  TrackerConfigService,
  TurnContextService
} from './application';
import {
  FoundryBattlefieldReader,
  FoundryCanvasCollisions,
  FoundryCombatStore,
  FoundryCombatTokenReader,
  FoundryCombatantGroupStore,
  FoundryCombatantStore,
  FoundryEncounterStore,
  FoundryTrackerConfigStore,
  type BattlefieldGlobalsProvider,
  type CombatClassProvider,
  type CombatConfigurationProvider,
  type CombatGameProvider,
  type CombatWorldGameProvider,
  type FoundryCombatGame,
  type FoundryCombatWorldGame
} from './infrastructure';

export const defaultCombatGameProvider: CombatGameProvider = globalGameProvider<FoundryCombatGame>();
export const defaultCombatWorldProvider: CombatWorldGameProvider = globalGameProvider<FoundryCombatWorldGame>();

export interface CombatWiring {
  readonly gameProvider?: CombatGameProvider;
  readonly combatClass?: CombatClassProvider;
  readonly canvasGlobals?: BattlefieldGlobalsProvider;
  /** The same `game`, as the encounter, group, token and tracker-configuration gateways read it. */
  readonly worldProvider?: CombatWorldGameProvider;
  /** `CONFIG.Combat.settings`. */
  readonly combatConfiguration?: CombatConfigurationProvider;
}

// Composition root of the context. Handlers pass custom providers only in tests.

export function createFoundryCombatService(wiring: CombatWiring = {}): CombatService {
  const store = new FoundryCombatStore(wiring.gameProvider ?? defaultCombatGameProvider, wiring.combatClass);
  return new CombatService({ combats: store, store, scenes: store });
}

export function createFoundryCombatantService(wiring: CombatWiring = {}): CombatantService {
  const gameProvider = wiring.gameProvider ?? defaultCombatGameProvider;
  const worldProvider = wiring.worldProvider ?? defaultCombatWorldProvider;
  const combatants = new FoundryCombatantStore(gameProvider);
  return new CombatantService({
    combats: new FoundryCombatStore(gameProvider, wiring.combatClass),
    combatants,
    initiative: combatants,
    groups: new FoundryCombatantGroupStore(worldProvider),
    scenes: new FoundrySceneLocator(worldProvider),
    tokens: new FoundryCombatTokenReader(worldProvider)
  });
}

export function createFoundryTurnContextService(wiring: CombatWiring = {}): TurnContextService {
  const gameProvider = wiring.gameProvider ?? defaultCombatGameProvider;
  const store = new FoundryCombatStore(gameProvider, wiring.combatClass);
  return new TurnContextService({
    combats: store,
    turns: store,
    battlefield: new FoundryBattlefieldReader(gameProvider, wiring.canvasGlobals),
    collisions: new FoundryCanvasCollisions(wiring.canvasGlobals)
  });
}

export function createFoundryEncounterService(wiring: CombatWiring = {}): EncounterService {
  const worldProvider = wiring.worldProvider ?? defaultCombatWorldProvider;
  const encounters = new FoundryEncounterStore(worldProvider);
  return new EncounterService({ combats: encounters, encounters, scenes: new FoundrySceneLocator(worldProvider) });
}

export function createFoundryCombatantGroupService(wiring: CombatWiring = {}): CombatantGroupService {
  const worldProvider = wiring.worldProvider ?? defaultCombatWorldProvider;
  return new CombatantGroupService({
    combats: new FoundryEncounterStore(worldProvider),
    groups: new FoundryCombatantGroupStore(worldProvider)
  });
}

export function createFoundryTrackerConfigService(wiring: CombatWiring = {}): TrackerConfigService {
  return new TrackerConfigService({
    config: new FoundryTrackerConfigStore(
      wiring.worldProvider ?? defaultCombatWorldProvider,
      wiring.combatConfiguration
    )
  });
}
