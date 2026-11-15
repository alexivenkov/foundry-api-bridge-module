import { FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { RegionBehaviorService, RegionService } from './application';
import type { ScriptBehaviorPolicy } from './domain';
import {
  FoundryRegionBehaviorCatalog,
  FoundryRegionBehaviorStore,
  FoundryRegionMacroResolver,
  FoundryRegionStore,
  macroScriptBehaviorPolicy,
  regionGlobalsFromGlobalThis,
  type FoundryRegionGame,
  type RegionGameProvider,
  type RegionGlobalsProvider
} from './infrastructure';
import { zodBehaviorConfigReader } from './validation';

export const defaultRegionGameProvider: RegionGameProvider = globalGameProvider<FoundryRegionGame>();

export interface RegionWiring {
  readonly gameProvider?: RegionGameProvider;
  /** `foundry`, `CONST`, `CONFIG` and `game.documentTypes`. */
  readonly globals?: RegionGlobalsProvider;
  /** The running Foundry generation; defaults to `foundryGeneration()`. */
  readonly generation?: () => number;
  readonly scripts?: ScriptBehaviorPolicy;
}

// Composition root of the context. Handlers pass custom wiring only in tests.

export function createFoundryRegionService(wiring: RegionWiring = {}): RegionService {
  const gameProvider = wiring.gameProvider ?? defaultRegionGameProvider;
  return new RegionService({
    scenes: new FoundrySceneLocator(gameProvider),
    regions: new FoundryRegionStore(gameProvider, wiring.globals, wiring.generation)
  });
}

export function createFoundryRegionBehaviorService(wiring: RegionWiring = {}): RegionBehaviorService {
  const gameProvider = wiring.gameProvider ?? defaultRegionGameProvider;
  const globals = wiring.globals ?? regionGlobalsFromGlobalThis;
  return new RegionBehaviorService({
    scenes: new FoundrySceneLocator(gameProvider),
    regions: new FoundryRegionStore(gameProvider, globals, wiring.generation),
    behaviors: new FoundryRegionBehaviorStore(gameProvider, globals, wiring.generation),
    catalog: new FoundryRegionBehaviorCatalog(globals, wiring.generation),
    scripts: wiring.scripts ?? macroScriptBehaviorPolicy,
    configs: zodBehaviorConfigReader,
    macros: new FoundryRegionMacroResolver(globals)
  });
}
