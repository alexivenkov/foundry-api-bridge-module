import { FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { WallService } from './application';
import {
  FoundryWallEnvironment,
  FoundryWallStore,
  type FoundryWallGame,
  type WallGameProvider,
  type WallGlobalsProvider
} from './infrastructure';

export const defaultWallGameProvider: WallGameProvider = globalGameProvider<FoundryWallGame>();

export interface WallEnvironmentWiring {
  readonly globals?: WallGlobalsProvider | undefined;
  readonly generation?: (() => number) | undefined;
}

// Composition root of the context: wires the Foundry-backed adapters into the
// application service. Handlers pass a custom provider or wiring only in tests.
export function createFoundryWallService(
  gameProvider: WallGameProvider = defaultWallGameProvider,
  environment: WallEnvironmentWiring = {}
): WallService {
  return new WallService({
    scenes: new FoundrySceneLocator(gameProvider),
    walls: new FoundryWallStore(gameProvider),
    environment: new FoundryWallEnvironment(environment.globals, environment.generation)
  });
}
