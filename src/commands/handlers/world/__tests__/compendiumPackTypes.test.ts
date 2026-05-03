import { getCompendiumGame } from '../compendiumPackTypes';

describe('getCompendiumGame', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('returns the game object from globalThis', () => {
    const fakeGame = { packs: { get: jest.fn() } };
    (globalThis as Record<string, unknown>)['game'] = fakeGame;

    const result = getCompendiumGame();

    expect(result).toBe(fakeGame);
  });
});
