import type { CompendiumGameGlobals } from './foundryPackTypes';

export interface CompendiumGameProvider {
  getGame(): CompendiumGameGlobals;
}

export const defaultCompendiumGameProvider: CompendiumGameProvider = {
  getGame(): CompendiumGameGlobals {
    return (globalThis as unknown as { game: CompendiumGameGlobals }).game;
  }
};
