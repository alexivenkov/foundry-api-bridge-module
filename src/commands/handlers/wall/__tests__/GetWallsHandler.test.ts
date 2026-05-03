import { getWallsHandler } from '../GetWallsHandler';
import type { FoundryWallDocument } from '../wallTypes';

interface MockScene {
  id: string;
  walls: {
    get: jest.Mock;
    contents: FoundryWallDocument[];
  };
  createEmbeddedDocuments: jest.Mock;
  deleteEmbeddedDocuments: jest.Mock;
}

const makeMockWall = (overrides: Partial<FoundryWallDocument> = {}): FoundryWallDocument => ({
  _id: 'wall-1',
  c: [0, 0, 100, 100],
  door: 0,
  ds: 0,
  move: 1,
  sense: 1,
  sound: 1,
  light: 1,
  dir: 0,
  update: jest.fn(),
  ...overrides
});

const makeMockScene = (id = 'scene-1', walls: FoundryWallDocument[] = []): MockScene => ({
  id,
  walls: {
    get: jest.fn((wallId: string) => walls.find(w => w._id === wallId)),
    contents: walls
  },
  createEmbeddedDocuments: jest.fn(),
  deleteEmbeddedDocuments: jest.fn()
});

const mockGame = {
  scenes: {
    get: jest.fn() as jest.Mock,
    active: null as MockScene | null
  }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

describe('getWallsHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = null;
    mockGame.scenes.get.mockReturnValue(undefined);
  });

  it('returns mapped walls from active scene when no sceneId provided', async () => {
    const walls = [
      makeMockWall({ _id: 'w1', c: [0, 0, 50, 50], door: 1, ds: 1, move: 1, sense: 2, sound: 0, light: 1, dir: 0 }),
      makeMockWall({ _id: 'w2', c: [50, 50, 100, 100], door: 0, ds: 0, move: 1, sense: 1, sound: 1, light: 1, dir: 1 }),
      makeMockWall({ _id: 'w3', c: [100, 100, 200, 200], door: 2, ds: 2, move: 0, sense: 0, sound: 0, light: 0, dir: 2 })
    ];
    mockGame.scenes.active = makeMockScene('active-scene', walls);

    const result = await getWallsHandler({});

    expect(result.sceneId).toBe('active-scene');
    expect(result.walls).toHaveLength(3);
    expect(result.walls[0]).toEqual({
      id: 'w1',
      c: [0, 0, 50, 50],
      door: 'door',
      doorState: 'open',
      move: 'normal',
      sense: 'limited',
      sound: 'none',
      light: 'normal',
      dir: 'both'
    });
    expect(result.walls[1]?.dir).toBe('left');
    expect(result.walls[2]).toEqual({
      id: 'w3',
      c: [100, 100, 200, 200],
      door: 'secret',
      doorState: 'locked',
      move: 'none',
      sense: 'none',
      sound: 'none',
      light: 'none',
      dir: 'right'
    });
    expect(mockGame.scenes.get).not.toHaveBeenCalled();
  });

  it('uses scene specified by sceneId', async () => {
    const walls = [makeMockWall({ _id: 'w1' })];
    const specificScene = makeMockScene('specific-scene', walls);
    mockGame.scenes.get.mockReturnValue(specificScene);

    const result = await getWallsHandler({ sceneId: 'specific-scene' });

    expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
    expect(result.sceneId).toBe('specific-scene');
    expect(result.walls).toHaveLength(1);
  });

  it('throws when no active scene and no sceneId given', async () => {
    mockGame.scenes.active = null;

    await expect(getWallsHandler({})).rejects.toThrow('No active scene; specify sceneId');
  });

  it('throws when scene not found by sceneId', async () => {
    mockGame.scenes.get.mockReturnValue(undefined);

    await expect(getWallsHandler({ sceneId: 'missing-scene' }))
      .rejects.toThrow('Scene not found: missing-scene');
  });

  it('returns empty array when scene has no walls', async () => {
    mockGame.scenes.active = makeMockScene('empty-scene', []);

    const result = await getWallsHandler({});

    expect(result.sceneId).toBe('empty-scene');
    expect(result.walls).toEqual([]);
  });

  it('uses default zeros for missing coordinate slots', async () => {
    const partialCoords = makeMockWall({ _id: 'w-pc', c: [10] });
    const emptyCoords = makeMockWall({ _id: 'w-ec', c: [] });
    mockGame.scenes.active = makeMockScene('s', [partialCoords, emptyCoords]);

    const result = await getWallsHandler({});

    expect(result.walls[0]?.c).toEqual([10, 0, 0, 0]);
    expect(result.walls[1]?.c).toEqual([0, 0, 0, 0]);
  });

  it('falls back to defaults when ds/move/sense/sound/light/dir are undefined on the wall doc', async () => {
    const sparseWall: import('../wallTypes').FoundryWallDocument = {
      _id: 'w-sparse',
      c: [0, 0, 1, 1],
      door: 0,
      ds: undefined,
      move: undefined,
      sense: undefined,
      sound: undefined,
      light: undefined,
      dir: undefined,
      update: jest.fn()
    };
    mockGame.scenes.active = makeMockScene('s', [sparseWall]);

    const result = await getWallsHandler({});

    expect(result.walls[0]).toEqual({
      id: 'w-sparse',
      c: [0, 0, 1, 1],
      door: 'none',
      doorState: 'closed',
      move: 'normal',
      sense: 'normal',
      sound: 'normal',
      light: 'normal',
      dir: 'both'
    });
  });

  it('falls back to default enum strings when wall fields contain unknown numbers', async () => {
    const exoticWall = makeMockWall({
      _id: 'w-x',
      door: 99,
      ds: 99,
      move: 99,
      sense: 99,
      sound: 99,
      light: 99,
      dir: 99
    });
    mockGame.scenes.active = makeMockScene('s', [exoticWall]);

    const result = await getWallsHandler({});

    expect(result.walls[0]).toEqual({
      id: 'w-x',
      c: [0, 0, 100, 100],
      door: 'none',
      doorState: 'closed',
      move: 'normal',
      sense: 'normal',
      sound: 'normal',
      light: 'normal',
      dir: 'both'
    });
  });

  it('wraps non-Error rejection from getSceneById path via try/catch fallback', async () => {
    // Force getGame() to throw a non-Error value by deleting game global
    const originalGame = (globalThis as Record<string, unknown>)['game'];
    Object.defineProperty(globalThis, 'game', {
      configurable: true,
      get: () => { throw 'plain string thrown'; }
    });

    try {
      await expect(getWallsHandler({})).rejects.toThrow('plain string thrown');
    } finally {
      Object.defineProperty(globalThis, 'game', {
        configurable: true,
        writable: true,
        value: originalGame
      });
    }
  });
});
