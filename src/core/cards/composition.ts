import { CardOperationService, CardStackService } from './application';
import type { ScriptCarrierPolicy } from './domain';
import {
  FoundryCardStackStore,
  FoundryCardStore,
  macroScriptCarrierPolicy,
  cardGlobalsFromGlobalThis,
  type CardGlobalsProvider
} from './infrastructure';

export const defaultCardGlobals: CardGlobalsProvider = cardGlobalsFromGlobalThis;

// Composition root of the context. Handlers pass custom globals only in tests.

export interface CardWiring {
  readonly scripts?: ScriptCarrierPolicy | undefined;
}

export function createFoundryCardStackService(
  globals: CardGlobalsProvider = defaultCardGlobals,
  wiring: CardWiring = {}
): CardStackService {
  return new CardStackService({
    stacks: new FoundryCardStackStore(globals),
    cards: new FoundryCardStore(globals),
    scripts: wiring.scripts ?? macroScriptCarrierPolicy
  });
}

export function createFoundryCardOperationService(
  globals: CardGlobalsProvider = defaultCardGlobals
): CardOperationService {
  return new CardOperationService({ stacks: new FoundryCardStackStore(globals), cards: new FoundryCardStore(globals) });
}
