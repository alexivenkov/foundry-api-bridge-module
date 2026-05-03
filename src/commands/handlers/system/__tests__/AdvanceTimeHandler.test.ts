import { advanceTimeHandler } from '../AdvanceTimeHandler';

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
      set: jest.fn().mockResolvedValue(worldTime)
    },
    paused: false,
    togglePause: jest.fn()
  };
  game.time.advance.mockImplementation((seconds: number) => {
    game.time.worldTime += seconds;
    return Promise.resolve(game.time.worldTime);
  });
  return game;
};

describe('advanceTimeHandler', () => {
  let mockGame: MockGame;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGame = createMockGame(100);
    (globalThis as Record<string, unknown>)['game'] = mockGame;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('advances time by positive seconds', async () => {
    const result = await advanceTimeHandler({ seconds: 60 });

    expect(mockGame.time.advance).toHaveBeenCalledWith(60);
    expect(result).toEqual({ worldTime: 160, advancedBy: 60 });
  });

  it('rewinds time with negative seconds', async () => {
    const result = await advanceTimeHandler({ seconds: -30 });

    expect(mockGame.time.advance).toHaveBeenCalledWith(-30);
    expect(result).toEqual({ worldTime: 70, advancedBy: -30 });
  });

  it('handles zero advance', async () => {
    const result = await advanceTimeHandler({ seconds: 0 });

    expect(mockGame.time.advance).toHaveBeenCalledWith(0);
    expect(result).toEqual({ worldTime: 100, advancedBy: 0 });
  });

  it('advances by large value', async () => {
    const result = await advanceTimeHandler({ seconds: 86_400 });

    expect(mockGame.time.advance).toHaveBeenCalledWith(86_400);
    expect(result.worldTime).toBe(86_500);
    expect(result.advancedBy).toBe(86_400);
  });

  it('result reflects new worldTime after advance', async () => {
    mockGame.time.advance.mockImplementation((seconds: number) => {
      mockGame.time.worldTime = 5_000 + seconds;
      return Promise.resolve(mockGame.time.worldTime);
    });

    const result = await advanceTimeHandler({ seconds: 250 });

    expect(result.worldTime).toBe(5_250);
    expect(result.advancedBy).toBe(250);
  });
});
