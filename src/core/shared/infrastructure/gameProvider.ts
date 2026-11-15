export interface GameProvider<TGame> {
  getGame(): TGame;
}

/** Reads the `game` global on every call, so a provider can be created before Foundry is ready. */
export function globalGameProvider<TGame>(): GameProvider<TGame> {
  return {
    getGame(): TGame {
      return (globalThis as unknown as { game: TGame }).game;
    }
  };
}
