import { FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { LightService } from './application';
import {
  FoundryLightEnvironment,
  FoundryLightStore,
  type FoundryLightGame,
  type LightGameProvider,
  type LightGlobalsProvider
} from './infrastructure';

export const defaultLightGameProvider: LightGameProvider = globalGameProvider<FoundryLightGame>();

export interface LightWiring {
  readonly gameProvider?: LightGameProvider | undefined;
  readonly globals?: LightGlobalsProvider | undefined;
  readonly generation?: (() => number) | undefined;
}

// Composition root of the context. Handlers pass custom wiring only in tests.
export function createFoundryLightService(wiring: LightWiring = {}): LightService {
  const gameProvider = wiring.gameProvider ?? defaultLightGameProvider;
  return new LightService({
    scenes: new FoundrySceneLocator(gameProvider),
    lights: new FoundryLightStore(gameProvider, wiring.generation),
    environment: new FoundryLightEnvironment(wiring.globals, wiring.generation)
  });
}
