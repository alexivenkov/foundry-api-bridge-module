import type { FoundryGameGlobals } from './foundryActorTypes';

export interface FoundryGameProvider {
  getGame(): FoundryGameGlobals;
}

export const defaultFoundryGameProvider: FoundryGameProvider = {
  getGame(): FoundryGameGlobals {
    const game = (globalThis as unknown as { game?: FoundryGameGlobals }).game;
    if (game === undefined) {
      throw new Error(
        'Foundry game globals not available (called before the ready hook?)'
      );
    }
    return game;
  }
};
