import { setWorldTimeHandler } from '../SetWorldTimeHandler';

interface MockGame {
  time: {
    worldTime: number;
    advance: jest.Mock;
    set: jest.Mock;
  };
  paused: boolean;
  togglePause: jest.Mock;
}

const createMockGame = (worldTime = 0): MockGame => {
  const game: MockGame = {
    time: {
      worldTime,
      advance: jest.fn(),
      set: jest.fn()
    },
    paused: false,
    togglePause: jest.fn()
  };
  game.time.set.mockImplementation((seconds: number) => {
    game.time.worldTime = seconds;
    return Promise.resolve(seconds);
  });
  return game;
};

describe('setWorldTimeHandler', () => {
  let mockGame: MockGame;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGame = createMockGame(100);
    (globalThis as Record<string, unknown>)['game'] = mockGame;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('sets worldTime to a positive value', async () => {
    const result = await setWorldTimeHandler({ worldTime: 5_000 });

    expect(mockGame.time.set).toHaveBeenCalledWith(5_000);
    expect(result).toEqual({ worldTime: 5_000 });
  });

  it('allows setting worldTime to zero', async () => {
    const result = await setWorldTimeHandler({ worldTime: 0 });

    expect(mockGame.time.set).toHaveBeenCalledWith(0);
    expect(result).toEqual({ worldTime: 0 });
  });

  it('throws when worldTime is negative', async () => {
    await expect(setWorldTimeHandler({ worldTime: -1 })).rejects.toThrow('worldTime must be >= 0');
    expect(mockGame.time.set).not.toHaveBeenCalled();
  });

  it('passes the exact value to game.time.set', async () => {
    await setWorldTimeHandler({ worldTime: 1_234_567 });

    expect(mockGame.time.set).toHaveBeenCalledTimes(1);
    expect(mockGame.time.set).toHaveBeenCalledWith(1_234_567);
  });
});
