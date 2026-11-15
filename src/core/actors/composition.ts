import { FoundryActorLocator, FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { ActorService } from './application';
import type { ScriptCarrierPolicy } from './domain';
import {
  FoundryActorStore,
  macroScriptCarrierPolicy,
  type ActorGameProvider,
  type FoundryActorGame
} from './infrastructure';

export const defaultActorGameProvider: ActorGameProvider = globalGameProvider<FoundryActorGame>();

export interface ActorWiring {
  readonly scripts?: ScriptCarrierPolicy | undefined;
}

// Composition root of the context. Handlers pass a custom provider and wiring only in tests.
export function createFoundryActorService(
  gameProvider: ActorGameProvider = defaultActorGameProvider,
  wiring: ActorWiring = {}
): ActorService {
  const actors = new FoundryActorStore(gameProvider);
  return new ActorService({
    scenes: new FoundrySceneLocator(gameProvider),
    locator: new FoundryActorLocator(gameProvider),
    actors,
    scripts: wiring.scripts ?? macroScriptCarrierPolicy,
    sources: actors
  });
}
