import { NegativeWorldTimeError } from '../../domain';
import { GamePauseService } from '../GamePauseService';
import { WorldInfoService } from '../WorldInfoService';
import { WorldTimeService } from '../WorldTimeService';
import {
  FakeGamePause,
  FakeWorldClock,
  FakeWorldInspector,
  compendiums,
  counts,
  identity
} from './fakePorts';

describe('WorldInfoService', () => {
  it('puts the identity, the counts and the compendiums of the world together', () => {
    const service = new WorldInfoService({ world: new FakeWorldInspector() });

    expect(service.getWorldInfo()).toEqual({ identity, counts, compendiums });
  });

  it('reads each part once', () => {
    const world = new FakeWorldInspector();

    new WorldInfoService({ world }).getWorldInfo();

    expect([...world.reads].sort()).toEqual(['compendiums', 'counts', 'identity']);
  });
});

describe('WorldTimeService', () => {
  function setup(time = 100): { service: WorldTimeService; clock: FakeWorldClock } {
    const clock = new FakeWorldClock(time);
    return { service: new WorldTimeService({ clock }), clock };
  }

  it('tells the world time', () => {
    expect(setup(1234).service.readTime()).toEqual({ worldTime: 1234 });
  });

  it('advances the clock and reports the new time with the step', async () => {
    const { service, clock } = setup(100);

    await expect(service.advanceTime({ seconds: 60 })).resolves.toEqual({ worldTime: 160, advancedBy: 60 });
    expect(clock.calls).toEqual(['advance:60']);
  });

  it.each([
    [-30, 70],
    [0, 100]
  ])('turns the clock by %i seconds without judging the step', async (seconds, worldTime) => {
    await expect(setup(100).service.advanceTime({ seconds })).resolves.toEqual({ worldTime, advancedBy: seconds });
  });

  it('reports the time the clock shows after the change, not the sum it expected', async () => {
    const { service, clock } = setup(100);
    clock.landsOn = 5250;

    await expect(service.advanceTime({ seconds: 250 })).resolves.toEqual({ worldTime: 5250, advancedBy: 250 });
  });

  it('sets the clock and reports the time it then shows', async () => {
    const { service, clock } = setup(100);

    await expect(service.setTime({ worldTime: 5000 })).resolves.toEqual({ worldTime: 5000 });
    expect(clock.calls).toEqual(['set:5000']);
  });

  it('reports the time the clock shows after setting it, not the one asked for', async () => {
    const { service, clock } = setup(100);
    clock.landsOn = 4999;

    await expect(service.setTime({ worldTime: 5000 })).resolves.toEqual({ worldTime: 4999 });
  });

  it('allows the very beginning of time', async () => {
    await expect(setup(100).service.setTime({ worldTime: 0 })).resolves.toEqual({ worldTime: 0 });
  });

  it.each([-1, -0.5, -86_400])('refuses the negative time %d without touching the clock', async (worldTime) => {
    const { service, clock } = setup(100);

    const attempt = service.setTime({ worldTime });

    await expect(attempt).rejects.toThrow(NegativeWorldTimeError);
    await expect(attempt).rejects.toThrow('worldTime must be >= 0');
    expect(clock.calls).toEqual([]);
  });
});

describe('GamePauseService', () => {
  it('tells whether the game is paused without changing it', () => {
    const pause = new FakeGamePause(true);
    const service = new GamePauseService({ pause });

    expect(service.isPaused()).toBe(true);
    expect(pause.calls).toEqual([]);
  });

  it('pauses the game', () => {
    const pause = new FakeGamePause(false);

    new GamePauseService({ pause }).pause();

    expect(pause.calls).toEqual([true]);
    expect(pause.isPaused()).toBe(true);
  });

  it('resumes the game', () => {
    const pause = new FakeGamePause(true);

    new GamePauseService({ pause }).resume();

    expect(pause.calls).toEqual([false]);
    expect(pause.isPaused()).toBe(false);
  });

  it('pauses a paused game again rather than toggling it', () => {
    const pause = new FakeGamePause(true);

    new GamePauseService({ pause }).pause();

    expect(pause.calls).toEqual([true]);
  });
});
