import { FoundryActorLocator, FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { EffectDetailsService, EffectService } from './application';
import type { ScriptCarrierPolicy } from './domain';
import {
  FoundryEffectDocumentStore,
  FoundryEffectEnvironment,
  FoundryEffectStore,
  macroScriptCarrierPolicy,
  type EffectGameProvider,
  type EffectGlobalsProvider,
  type FoundryEffectsGame
} from './infrastructure';

export const defaultEffectGameProvider: EffectGameProvider = globalGameProvider<FoundryEffectsGame>();

/** What tests replace: the game, the `CONST` / `CONFIG` globals, the Foundry generation. */
export interface EffectWiring {
  readonly globals?: EffectGlobalsProvider | undefined;
  readonly generation?: (() => number) | undefined;
  readonly scripts?: ScriptCarrierPolicy | undefined;
}

// Composition root of the context. Handlers pass a custom provider and wiring only in tests.
export function createFoundryEffectService(
  gameProvider: EffectGameProvider = defaultEffectGameProvider,
  wiring: EffectWiring = {}
): EffectService {
  return new EffectService({
    scenes: new FoundrySceneLocator(gameProvider),
    actors: new FoundryActorLocator(gameProvider),
    effects: new FoundryEffectStore(gameProvider, wiring.generation),
    environment: new FoundryEffectEnvironment(gameProvider, wiring.globals, wiring.generation),
    scripts: wiring.scripts ?? macroScriptCarrierPolicy
  });
}

export function createFoundryEffectDetailsService(
  gameProvider: EffectGameProvider = defaultEffectGameProvider,
  wiring: EffectWiring = {}
): EffectDetailsService {
  return new EffectDetailsService({
    scenes: new FoundrySceneLocator(gameProvider),
    actors: new FoundryActorLocator(gameProvider),
    documents: new FoundryEffectDocumentStore(gameProvider, wiring.generation),
    environment: new FoundryEffectEnvironment(gameProvider, wiring.globals, wiring.generation),
    scripts: wiring.scripts ?? macroScriptCarrierPolicy
  });
}
