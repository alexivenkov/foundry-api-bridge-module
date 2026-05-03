import type { FoundryItemGameGlobals } from './foundryItemTypes';

export interface FoundryItemGameProvider {
  getGame(): FoundryItemGameGlobals;
}

export const defaultFoundryItemGameProvider: FoundryItemGameProvider = {
  getGame(): FoundryItemGameGlobals {
    const game = (globalThis as unknown as { game?: FoundryItemGameGlobals }).game;
    if (game === undefined) {
      throw new Error(
        'Foundry game globals not available (called before the ready hook?)'
      );
    }
    return game;
  }
};
