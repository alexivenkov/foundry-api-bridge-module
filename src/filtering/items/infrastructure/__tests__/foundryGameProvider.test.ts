import { defaultFoundryItemGameProvider } from '../foundryGameProvider';
import type { FoundryItemGameGlobals } from '../foundryItemTypes';

function setGlobalGame(game: FoundryItemGameGlobals | undefined): void {
  if (game === undefined) {
    delete (globalThis as Record<string, unknown>)['game'];
  } else {
    (globalThis as Record<string, unknown>)['game'] = game;
  }
}

describe('defaultFoundryItemGameProvider', () => {
  afterEach(() => {
    setGlobalGame(undefined);
  });

  it('returns globalThis.game when present', () => {
    const game: FoundryItemGameGlobals = {
      items: { contents: [] },
      folders: { get: jest.fn(), contents: [] }
    };
    setGlobalGame(game);

    expect(defaultFoundryItemGameProvider.getGame()).toBe(game);
  });

  it('throws a descriptive error when globalThis.game is undefined', () => {
    setGlobalGame(undefined);
    expect(() => defaultFoundryItemGameProvider.getGame()).toThrow(
      /Foundry game globals not available/
    );
  });
});
