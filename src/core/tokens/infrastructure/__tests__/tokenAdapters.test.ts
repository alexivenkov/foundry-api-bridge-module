import type { Wall, WallService } from '../../../walls';
import { FoundryMovementSurface } from '../FoundryMovementSurface';
import { FoundryTokenTargeting, type FoundryTargetingGlobals } from '../FoundryTokenTargeting';
import { WallPassages } from '../WallPassages';

describe('FoundryMovementSurface', () => {
  const collision = { testCollision: jest.fn() };

  it('offers the core movement backend with the grid of the viewed scene', () => {
    const surface = new FoundryMovementSurface(() => ({
      CONFIG: { Canvas: { polygonBackends: { move: collision } } },
      canvas: { scene: { grid: { size: 70 } } }
    }));

    expect(surface.probe()).toEqual({ gridSize: 70, collision });
  });

  it.each([
    ['no canvas', { CONFIG: { Canvas: { polygonBackends: { move: collision } } } }],
    ['no collision backend', { canvas: { scene: { grid: { size: 70 } } } }],
    ['nothing at all', {}]
  ])('has nothing to offer with %s', (_case, globals) => {
    expect(new FoundryMovementSurface(() => globals).probe()).toBeNull();
  });
});

describe('WallPassages', () => {
  function wall(overrides: Partial<Wall> = {}): Wall {
    return {
      id: 'w1',
      segment: [0, 0, 100, 0],
      door: 'none',
      doorState: 'closed',
      movement: 'normal',
      sight: 'normal',
      sound: 'normal',
      light: 'normal',
      direction: 'both',
      ...overrides
    };
  }

  function passagesOver(walls: Wall[]): { passages: WallPassages; setDoorState: jest.Mock; pause: jest.Mock } {
    const setDoorState = jest.fn().mockResolvedValue(undefined);
    const pause = jest.fn().mockResolvedValue(undefined);
    const service = {
      listWalls: () => ({ sceneId: 'dungeon', walls }),
      setDoorState
    } as unknown as WallService;
    return { passages: new WallPassages(service, pause), setDoorState, pause };
  }

  it('describes walls by what they mean for movement', () => {
    const { passages } = passagesOver([
      wall({ id: 'plain' }),
      wall({ id: 'window', movement: 'none' }),
      wall({ id: 'gate', door: 'door', doorState: 'locked' })
    ]);

    expect(passages.listWalls('dungeon')).toEqual([
      { id: 'plain', segment: [0, 0, 100, 0], door: 'none', doorState: 'closed', blocksMovement: true },
      { id: 'window', segment: [0, 0, 100, 0], door: 'none', doorState: 'closed', blocksMovement: false },
      { id: 'gate', segment: [0, 0, 100, 0], door: 'door', doorState: 'locked', blocksMovement: true }
    ]);
  });

  it('opens a closed door and waits for it to swing open', async () => {
    const { passages, setDoorState, pause } = passagesOver([wall({ id: 'gate', door: 'door' })]);

    await expect(passages.openDoor('dungeon', 'gate')).resolves.toBe(true);
    expect(setDoorState).toHaveBeenCalledWith({ sceneId: 'dungeon', wallId: 'gate', state: 'open' });
    expect(pause).toHaveBeenCalledWith(400);
  });

  it.each([
    ['a door that is already open', wall({ id: 'gate', door: 'door', doorState: 'open' })],
    ['a locked door', wall({ id: 'gate', door: 'door', doorState: 'locked' })],
    ['a plain wall', wall({ id: 'gate' })]
  ])('leaves %s alone', async (_case, target) => {
    const { passages, setDoorState, pause } = passagesOver([target]);

    await expect(passages.openDoor('dungeon', 'gate')).resolves.toBe(false);
    expect(setDoorState).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
  });

  it('leaves an unknown wall alone', async () => {
    await expect(passagesOver([]).passages.openDoor('dungeon', 'missing')).resolves.toBe(false);
  });
});

describe('FoundryTokenTargeting', () => {
  function globalsWith(targetIds: string[] = []): {
    globals: FoundryTargetingGlobals;
    setTarget: jest.Mock;
  } {
    const setTarget = jest.fn();
    const placeable = (id: string): { id: string; setTarget: jest.Mock } => ({ id, setTarget });
    const user = { id: 'gm', targets: new Set(targetIds.map(placeable)) };
    return {
      globals: {
        game: { user },
        canvas: { tokens: { get: (id: string) => (id === 't1' ? placeable('t1') : undefined) } }
      },
      setTarget
    };
  }

  it('targets a canvas token for the current user', () => {
    const { globals, setTarget } = globalsWith();
    const targeting = new FoundryTokenTargeting(() => globals);

    expect(targeting.isAvailable()).toBe(true);
    expect(targeting.setTarget('t1', true, false)).toBe(true);
    expect(setTarget).toHaveBeenCalledWith(true, { user: globals.game.user, releaseOthers: false });
  });

  it('reports a token that is not on the canvas', () => {
    const { globals, setTarget } = globalsWith();

    expect(new FoundryTokenTargeting(() => globals).setTarget('elsewhere', true, true)).toBe(false);
    expect(setTarget).not.toHaveBeenCalled();
  });

  it.each([
    ['no canvas', undefined],
    ['a null canvas', null],
    ['no tokens layer', { tokens: null }],
    ['a canvas without a tokens layer', {}]
  ])('is unavailable with %s', (_case, canvas) => {
    const { globals } = globalsWith();

    expect(new FoundryTokenTargeting(() => ({ game: globals.game, canvas })).isAvailable()).toBe(false);
  });

  it('releases every target of the user without touching the canvas', () => {
    const { globals, setTarget } = globalsWith(['a', 'b', 'c']);
    const targeting = new FoundryTokenTargeting(() => ({ game: globals.game }));

    expect(targeting.clearTargets()).toBe(3);
    expect(setTarget).toHaveBeenCalledTimes(3);
    expect(setTarget).toHaveBeenCalledWith(false, { user: globals.game.user, releaseOthers: false });
  });
});
