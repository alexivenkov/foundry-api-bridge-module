import { GameNotAvailableError } from '../../domain';
import { FoundryGamePause } from '../FoundryGamePause';
import { FoundryWorldClock } from '../FoundryWorldClock';
import type { FoundryRunningGame } from '../foundryWorldTypes';
import { readRunningGame, runningGameProvider } from '../runningGame';

interface GameMocks {
  game: FoundryRunningGame;
  advance: jest.Mock;
  set: jest.Mock;
  togglePause: jest.Mock;
}

function runningGame(worldTime = 100, paused = false): GameMocks {
  const advance = jest.fn();
  const set = jest.fn();
  const togglePause = jest.fn();
  const game: FoundryRunningGame = { time: { worldTime, advance, set }, paused, togglePause };
  advance.mockImplementation((seconds: number) => {
    game.time.worldTime += seconds;
    return Promise.resolve(game.time.worldTime);
  });
  set.mockImplementation((seconds: number) => {
    game.time.worldTime = seconds;
    return Promise.resolve(seconds);
  });
  togglePause.mockImplementation((state: boolean) => {
    game.paused = state;
    return state;
  });
  return { game, advance, set, togglePause };
}

describe('FoundryWorldClock', () => {
  it('reads the world time of the game', () => {
    const { game } = runningGame(1234);

    expect(new FoundryWorldClock({ getGame: () => game }).now()).toBe(1234);
  });

  it('advances the game time by the given seconds and nothing else', async () => {
    const { game, advance } = runningGame(100);
    const clock = new FoundryWorldClock({ getGame: () => game });

    await clock.advance(-30);

    expect(advance).toHaveBeenCalledTimes(1);
    expect(advance).toHaveBeenCalledWith(-30);
    expect(clock.now()).toBe(70);
  });

  it('sets the game time to the given second', async () => {
    const { game, set } = runningGame(100);
    const clock = new FoundryWorldClock({ getGame: () => game });

    await clock.set(5000);

    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(5000);
    expect(clock.now()).toBe(5000);
  });

  it('waits for the core before it resolves', async () => {
    const { game, advance } = runningGame(100);
    let landed = false;
    advance.mockImplementation(async () => {
      await Promise.resolve();
      landed = true;
      return 0;
    });

    await new FoundryWorldClock({ getGame: () => game }).advance(1);

    expect(landed).toBe(true);
  });

  it('lets a refusal of the core through', async () => {
    const { game, set } = runningGame();
    set.mockRejectedValue(new Error('not the GM'));

    await expect(new FoundryWorldClock({ getGame: () => game }).set(1)).rejects.toThrow('not the GM');
  });
});

describe('FoundryGamePause', () => {
  it('reads the pause of the game', () => {
    expect(new FoundryGamePause({ getGame: () => runningGame(0, true).game }).isPaused()).toBe(true);
    expect(new FoundryGamePause({ getGame: () => runningGame(0, false).game }).isPaused()).toBe(false);
  });

  it.each([true, false])('sets the pause to %s for every client, by broadcast', (paused) => {
    const { game, togglePause } = runningGame(0, !paused);

    new FoundryGamePause({ getGame: () => game }).setPaused(paused);

    expect(togglePause).toHaveBeenCalledTimes(1);
    expect(togglePause).toHaveBeenCalledWith(paused, { broadcast: true });
  });

  it('does not toggle the pause to read it', () => {
    const { game, togglePause } = runningGame();

    new FoundryGamePause({ getGame: () => game }).isPaused();

    expect(togglePause).not.toHaveBeenCalled();
  });
});

describe('the running game', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('is the game global', () => {
    const { game } = runningGame();
    (globalThis as Record<string, unknown>)['game'] = game;

    expect(readRunningGame()).toBe(game);
    expect(runningGameProvider.getGame()).toBe(game);
  });

  it('is not available before Foundry has set the global', () => {
    expect(readRunningGame).toThrow(GameNotAvailableError);
    expect(() => runningGameProvider.getGame()).toThrow('Game not available');
  });

  it('makes a clock and a pause built early fail only when they are used early', () => {
    const clock = new FoundryWorldClock(runningGameProvider);
    const pause = new FoundryGamePause(runningGameProvider);

    expect(() => clock.now()).toThrow('Game not available');
    expect(() => pause.isPaused()).toThrow('Game not available');

    (globalThis as Record<string, unknown>)['game'] = runningGame(42, true).game;

    expect(clock.now()).toBe(42);
    expect(pause.isPaused()).toBe(true);
  });
});
