import {
  PathBlockedError,
  TokenLostError,
  TokenNotFoundError,
  type CollisionChecker,
  type PassageWall,
  type Point
} from '../../domain';
import { TokenMovementService } from '../TokenMovementService';
import type { MoveTokenCommand } from '../commands';
import { FakePassages, FakeSceneLocator, FakeSurface, FakeTokenStore, surface, token } from './fakePorts';

const open: CollisionChecker = { testCollision: () => false };

function barrierAt(at: number): CollisionChecker {
  return {
    testCollision: (origin: Point, destination: Point): boolean =>
      (origin.x < at && destination.x >= at) || (origin.x >= at && destination.x < at)
  };
}

function shortWallAt(at: number): CollisionChecker {
  return {
    testCollision: (origin: Point, destination: Point): boolean => {
      const crosses = (origin.x < at && destination.x >= at) || (origin.x >= at && destination.x < at);
      return crosses && origin.y >= 0 && origin.y < 100 && destination.y >= 0 && destination.y < 100;
    }
  };
}

const door: PassageWall = {
  id: 'door-1',
  segment: [200, -10000, 200, 10000],
  door: 'door',
  doorState: 'closed',
  blocksMovement: true
};

function command(overrides: Partial<MoveTokenCommand> = {}): MoveTokenCommand {
  return {
    sceneId: undefined,
    tokenId: 't1',
    x: 300,
    y: 0,
    elevation: undefined,
    rotation: undefined,
    animate: true,
    canOpenDoors: false,
    ...overrides
  };
}

function setup(options: { surface?: FakeSurface; passages?: FakePassages } = {}): {
  service: TokenMovementService;
  store: FakeTokenStore;
  passages: FakePassages;
} {
  const store = new FakeTokenStore({ dungeon: [token({ id: 't1', x: 100, y: 0 })] });
  const passages = options.passages ?? new FakePassages();
  const service = new TokenMovementService({
    scenes: new FakeSceneLocator(['dungeon'], 'dungeon'),
    tokens: store,
    surface: options.surface ?? new FakeSurface(null),
    passages
  });
  return { service, store, passages };
}

describe('TokenMovementService', () => {
  it('rejects an unknown token', async () => {
    await expect(setup().service.moveToken(command({ tokenId: 'missing' }))).rejects.toThrow(TokenNotFoundError);
  });

  describe('without a canvas to test collisions', () => {
    it('moves straight to the destination in one animated step', async () => {
      const { service, store } = setup();

      const result = await service.moveToken(command({ elevation: 20, rotation: 90 }));

      expect(store.placed).toEqual([
        { placement: { x: 300, y: 0, elevation: 20, rotation: 90 }, options: { animate: true, throughDoor: false } }
      ]);
      expect(result).toEqual({ token: expect.objectContaining({ x: 300, y: 0, elevation: 20 }) as unknown });
    });

    it('does not ask about doors', async () => {
      const { service, passages } = setup();

      await service.moveToken(command({ canOpenDoors: true }));

      expect(passages.listed).toEqual([]);
    });

    it('moves without animation when asked', async () => {
      const { service, store } = setup();

      await service.moveToken(command({ animate: false }));

      expect(store.placed[0]?.options.animate).toBe(false);
    });
  });

  describe('around obstacles', () => {
    it('moves straight when the way is clear and reports no path cost', async () => {
      const { service, store } = setup({ surface: surface(open) });

      const result = await service.moveToken(command());

      expect(store.placed).toHaveLength(1);
      expect(result.pathCost).toBeUndefined();
      expect(result.doorsOpened).toBeUndefined();
    });

    it('walks the route cell by cell, animating only the last step', async () => {
      const { service, store } = setup({ surface: surface(shortWallAt(200)) });

      const result = await service.moveToken(command({ elevation: 10, rotation: 45 }));

      expect(store.placed.length).toBeGreaterThan(1);
      const last = store.placed.at(-1);
      expect(store.placed.slice(0, -1).every((step) => !step.options.animate)).toBe(true);
      expect(store.placed.slice(0, -1).every((step) => step.placement.elevation === undefined)).toBe(true);
      expect(last).toEqual({
        placement: { x: 300, y: 0, elevation: 10, rotation: 45 },
        options: { animate: true, throughDoor: false }
      });
      expect(result.pathCost).toBeGreaterThan(0);
      expect(result.token).toMatchObject({ x: 300, y: 0 });
    });

    it('fails when no route exists and leaves the token where it was', async () => {
      const { service, store } = setup({ surface: surface(barrierAt(200)) });

      await expect(service.moveToken(command())).rejects.toThrow(PathBlockedError);
      expect(store.placed).toEqual([]);
    });

    it('fails when the token disappears on the way', async () => {
      const { service, store } = setup({ surface: surface(shortWallAt(200)) });
      store.losesTokenAfterStep = 1;

      await expect(service.moveToken(command())).rejects.toThrow(TokenLostError);
    });
  });

  describe('through doors', () => {
    it('opens a closed door right before the step that crosses it', async () => {
      const passages = new FakePassages([door]);
      const { service, store } = setup({ surface: surface(barrierAt(200)), passages });

      const result = await service.moveToken(command({ canOpenDoors: true }));

      expect(passages.listed).toEqual(['dungeon']);
      expect(passages.opened).toEqual(['door-1']);
      expect(store.placed).toEqual([
        { placement: { x: 300, y: 0 }, options: { animate: true, throughDoor: true } }
      ]);
      expect(result.doorsOpened).toEqual(['door-1']);
      expect(result.pathCost).toBeUndefined();
    });

    it('does not report a door that turned out to be open already', async () => {
      const passages = new FakePassages([door]);
      passages.stuckDoors = ['door-1'];
      const { service } = setup({ surface: surface(barrierAt(200)), passages });

      const result = await service.moveToken(command({ canOpenDoors: true }));

      expect(result.doorsOpened).toBeUndefined();
    });

    it('does not open doors unless allowed to', async () => {
      const passages = new FakePassages([door]);
      const { service } = setup({ surface: surface(barrierAt(200)), passages });

      await expect(service.moveToken(command({ canOpenDoors: false }))).rejects.toThrow(PathBlockedError);
      expect(passages.opened).toEqual([]);
    });

    it('does not open a locked door', async () => {
      const passages = new FakePassages([{ ...door, doorState: 'locked' }]);
      const { service } = setup({ surface: surface(barrierAt(200)), passages });

      await expect(service.moveToken(command({ canOpenDoors: true }))).rejects.toThrow(PathBlockedError);
      expect(passages.opened).toEqual([]);
    });
  });
});
