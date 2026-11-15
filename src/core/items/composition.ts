import { FoundryActorLocator, FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { ActorItemService, WorldItemService } from './application';
import type { ScriptCarrierPolicy } from './domain';
import {
  FoundryActorInventory,
  FoundryWorldItemStore,
  macroScriptCarrierPolicy,
  type FoundryItemGame,
  type FoundryItemOwnersGame,
  type ItemGameProvider
} from './infrastructure';

export const defaultItemGameProvider: ItemGameProvider = globalGameProvider<FoundryItemGame & FoundryItemOwnersGame>();

export interface ItemWiring {
  readonly scripts?: ScriptCarrierPolicy | undefined;
}

// Composition root of the context. Handlers pass a custom provider and wiring only in tests.

export function createFoundryWorldItemService(
  gameProvider: ItemGameProvider = defaultItemGameProvider,
  wiring: ItemWiring = {}
): WorldItemService {
  return new WorldItemService({
    items: new FoundryWorldItemStore(gameProvider),
    scripts: wiring.scripts ?? macroScriptCarrierPolicy
  });
}

export function createFoundryActorItemService(
  gameProvider: ItemGameProvider = defaultItemGameProvider,
  wiring: ItemWiring = {}
): ActorItemService {
  const inventory = new FoundryActorInventory(gameProvider);
  return new ActorItemService({
    scenes: new FoundrySceneLocator(gameProvider),
    actors: new FoundryActorLocator(gameProvider),
    inventory,
    scripts: wiring.scripts ?? macroScriptCarrierPolicy,
    sources: inventory
  });
}
