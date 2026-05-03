import { pauseGameHandler } from '../PauseGameHandler';

interface MockGame {
  time: {
    worldTime: number;
    advance: jest.Mock;
    set: jest.Mock;
  };
  paused: boolean;
  togglePause: jest.Mock;
}

const createMockGame = (): MockGame => ({
  time: {
    worldTime: 0,
    advance: jest.fn(),
    set: jest.fn()
  },
  paused: false,
  togglePause: jest.fn().mockReturnValue(true)
});

describe('pauseGameHandler', () => {
  let mockGame: MockGame;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGame = createMockGame();
    (globalThis as Record<string, unknown>)['game'] = mockGame;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('calls togglePause(true, { broadcast: true })', async () => {
    await pauseGameHandler({});

    expect(mockGame.togglePause).toHaveBeenCalledWith(true, { broadcast: true });
  });

  it('returns paused: true', async () => {
    const result = await pauseGameHandler({});

    expect(result).toEqual({ paused: true });
  });

  it('calls togglePause exactly once', async () => {
    await pauseGameHandler({});

    expect(mockGame.togglePause).toHaveBeenCalledTimes(1);
  });
});
