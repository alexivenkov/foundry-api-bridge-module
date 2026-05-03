import { resumeGameHandler } from '../ResumeGameHandler';

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
  paused: true,
  togglePause: jest.fn().mockReturnValue(false)
});

describe('resumeGameHandler', () => {
  let mockGame: MockGame;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGame = createMockGame();
    (globalThis as Record<string, unknown>)['game'] = mockGame;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('calls togglePause(false, { broadcast: true })', async () => {
    await resumeGameHandler({});

    expect(mockGame.togglePause).toHaveBeenCalledWith(false, { broadcast: true });
  });

  it('returns paused: false', async () => {
    const result = await resumeGameHandler({});

    expect(result).toEqual({ paused: false });
  });

  it('calls togglePause exactly once', async () => {
    await resumeGameHandler({});

    expect(mockGame.togglePause).toHaveBeenCalledTimes(1);
  });
});
