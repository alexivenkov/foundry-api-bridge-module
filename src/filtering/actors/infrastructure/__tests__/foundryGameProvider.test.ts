import { defaultFoundryGameProvider } from '../foundryGameProvider';
import type { FoundryGameGlobals } from '../foundryActorTypes';

function setGlobalGame(game: FoundryGameGlobals | undefined): void {
  if (game === undefined) {
    delete (globalThis as Record<string, unknown>)['game'];
  } else {
    (globalThis as Record<string, unknown>)['game'] = game;
  }
}

describe('defaultFoundryGameProvider', () => {
  afterEach(() => {
    setGlobalGame(undefined);
  });

  it('returns globalThis.game when present', () => {
    const game: FoundryGameGlobals = {
      actors: { contents: [] },
      folders: { get: jest.fn(), contents: [] }
    };
    setGlobalGame(game);

    expect(defaultFoundryGameProvider.getGame()).toBe(game);
  });

  it('throws a descriptive error when globalThis.game is undefined', () => {
    setGlobalGame(undefined);

    expect(() => defaultFoundryGameProvider.getGame()).toThrow(
      /Foundry game globals not available/
    );
  });
});
