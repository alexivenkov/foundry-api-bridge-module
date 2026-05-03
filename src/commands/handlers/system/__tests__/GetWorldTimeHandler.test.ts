import { getWorldTimeHandler } from '../GetWorldTimeHandler';

interface MockGame {
  time: {
    worldTime: number;
    advance: jest.Mock;
    set: jest.Mock;
  };
  paused: boolean;
  togglePause: jest.Mock;
}

const createMockGame = (worldTime = 0): MockGame => ({
  time: {
    worldTime,
    advance: jest.fn().mockResolvedValue(worldTime),
    set: jest.fn().mockResolvedValue(worldTime)
  },
  paused: false,
  togglePause: jest.fn()
});

describe('getWorldTimeHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('returns current worldTime from game.time', async () => {
    (globalThis as Record<string, unknown>)['game'] = createMockGame(1234);

    const result = await getWorldTimeHandler({});

    expect(result).toEqual({ worldTime: 1234 });
  });

  it('returns 0 when game time is at zero', async () => {
    (globalThis as Record<string, unknown>)['game'] = createMockGame(0);

    const result = await getWorldTimeHandler({});

    expect(result).toEqual({ worldTime: 0 });
  });

  it('returns large worldTime values', async () => {
    (globalThis as Record<string, unknown>)['game'] = createMockGame(9_999_999_999);

    const result = await getWorldTimeHandler({});

    expect(result).toEqual({ worldTime: 9_999_999_999 });
  });
});
