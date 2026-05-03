import { getPauseStateHandler } from '../GetPauseStateHandler';

interface MockGame {
  time: {
    worldTime: number;
    advance: jest.Mock;
    set: jest.Mock;
  };
  paused: boolean;
  togglePause: jest.Mock;
}

const createMockGame = (paused: boolean): MockGame => ({
  time: {
    worldTime: 0,
    advance: jest.fn(),
    set: jest.fn()
  },
  paused,
  togglePause: jest.fn()
});

describe('getPauseStateHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('returns paused: true when game is paused', async () => {
    (globalThis as Record<string, unknown>)['game'] = createMockGame(true);

    const result = await getPauseStateHandler({});

    expect(result).toEqual({ paused: true });
  });

  it('returns paused: false when game is running', async () => {
    (globalThis as Record<string, unknown>)['game'] = createMockGame(false);

    const result = await getPauseStateHandler({});

    expect(result).toEqual({ paused: false });
  });

  it('does not call togglePause', async () => {
    const game = createMockGame(false);
    (globalThis as Record<string, unknown>)['game'] = game;

    await getPauseStateHandler({});

    expect(game.togglePause).not.toHaveBeenCalled();
  });
});
