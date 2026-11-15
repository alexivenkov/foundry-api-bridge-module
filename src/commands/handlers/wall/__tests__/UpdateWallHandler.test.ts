import { updateWallHandler } from '../UpdateWallHandler';
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

const makeMockWall = (overrides: Partial<FoundryWallDocument> = {}): FoundryWallDocument => {
  const wall: FoundryWallDocument = {
    _id: 'wall-1',
    c: [0, 0, 100, 100],
    door: 1,
    ds: 0,
    move: 20,
    sight: 20,
    sound: 20,
    light: 20,
    dir: 0,
    update: jest.fn(),
    ...overrides
  };
  (wall.update as jest.Mock).mockImplementation(async (data: Partial<FoundryWallDocument>) => {
    Object.assign(wall, data);
    return undefined;
  });
  return wall;
};

const makeMockScene = (id = 'scene-1', wall?: FoundryWallDocument): MockScene => ({
  id,
  walls: {
    get: jest.fn().mockReturnValue(wall),
    contents: wall ? [wall] : []
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

describe('updateWallHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = null;
    mockGame.scenes.get.mockReturnValue(undefined);
  });

  it('updates only doorState', async () => {
    const wall = makeMockWall({ _id: 'w1', door: 1, ds: 0 });
    mockGame.scenes.active = makeMockScene('active', wall);

    const result = await updateWallHandler({ wallId: 'w1', doorState: 'open' });

    expect(wall.update).toHaveBeenCalledWith({ ds: 1 });
    expect(result.doorState).toBe('open');
  });

  it('updates multiple fields together', async () => {
    const wall = makeMockWall({ _id: 'w1' });
    mockGame.scenes.active = makeMockScene('active', wall);

    const result = await updateWallHandler({
      wallId: 'w1',
      door: 'secret',
      doorState: 'locked',
      move: 'none',
      sense: 'limited',
      sound: 'none',
      light: 'none',
      dir: 'left'
    });

    expect(wall.update).toHaveBeenCalledWith({
      door: 2,
      ds: 2,
      move: 0,
      sight: 10,
      sound: 0,
      light: 0,
      dir: 1
    });
    expect(result.door).toBe('secret');
    expect(result.doorState).toBe('locked');
    expect(result.move).toBe('none');
    expect(result.sense).toBe('limited');
    expect(result.dir).toBe('left');
  });

  it('maps normal and limited restrictions to the core sense types 20 and 10', async () => {
    const wall = makeMockWall({ _id: 'w1', move: 0, sight: 0, sound: 0, light: 0 });
    mockGame.scenes.active = makeMockScene('active', wall);

    const result = await updateWallHandler({
      wallId: 'w1',
      move: 'normal',
      sense: 'normal',
      sound: 'limited',
      light: 'limited'
    });

    expect(wall.update).toHaveBeenCalledWith({ move: 20, sight: 20, sound: 10, light: 10 });
    expect(result.move).toBe('normal');
    expect(result.sense).toBe('normal');
    expect(result.sound).toBe('limited');
    expect(result.light).toBe('limited');
  });

  it('rejects limited movement, which the core does not support', async () => {
    const wall = makeMockWall({ _id: 'w1' });
    mockGame.scenes.active = makeMockScene('active', wall);

    await expect(updateWallHandler({ wallId: 'w1', move: 'limited' }))
      .rejects.toThrow("Wall move must be 'none' or 'normal'");

    expect(wall.update).not.toHaveBeenCalled();
  });

  it('partial update: only door type', async () => {
    const wall = makeMockWall({ _id: 'w1', door: 0 });
    mockGame.scenes.active = makeMockScene('active', wall);

    await updateWallHandler({ wallId: 'w1', door: 'door' });

    expect(wall.update).toHaveBeenCalledWith({ door: 1 });
  });

  it('updates coordinates c', async () => {
    const wall = makeMockWall({ _id: 'w1', c: [0, 0, 100, 100] });
    mockGame.scenes.active = makeMockScene('active', wall);

    const result = await updateWallHandler({ wallId: 'w1', c: [50, 50, 200, 200] });

    expect(wall.update).toHaveBeenCalledWith({ c: [50, 50, 200, 200] });
    expect(result.c).toEqual([50, 50, 200, 200]);
  });

  it('throws when wall not found', async () => {
    const scene = makeMockScene('active');
    scene.walls.get.mockReturnValue(undefined);
    mockGame.scenes.active = scene;

    await expect(updateWallHandler({ wallId: 'missing', doorState: 'open' }))
      .rejects.toThrow('Wall not found: missing');
  });

  it('throws when scene not found', async () => {
    mockGame.scenes.get.mockReturnValue(undefined);

    await expect(updateWallHandler({
      sceneId: 'missing-scene',
      wallId: 'w1',
      doorState: 'open'
    })).rejects.toThrow('Scene not found: missing-scene');
  });

  it('maps numbers back to wire strings via mapWallToSummary', async () => {
    const wall = makeMockWall({ _id: 'w1', door: 0 });
    mockGame.scenes.active = makeMockScene('active', wall);

    const result = await updateWallHandler({ wallId: 'w1', dir: 'right' });

    expect(result).toEqual({
      id: 'w1',
      c: [0, 0, 100, 100],
      door: 'none',
      doorState: 'closed',
      move: 'normal',
      sense: 'normal',
      sound: 'normal',
      light: 'normal',
      dir: 'right'
    });
  });

  it('no-op update — update() resolves undefined without mutating', async () => {
    const wall = makeMockWall({ _id: 'w1', door: 1, ds: 0 });
    (wall.update as jest.Mock).mockResolvedValue(undefined);
    mockGame.scenes.active = makeMockScene('active', wall);

    const result = await updateWallHandler({ wallId: 'w1', doorState: 'closed' });

    expect(wall.update).toHaveBeenCalledWith({ ds: 0 });
    expect(result).toEqual({
      id: 'w1',
      c: [0, 0, 100, 100],
      door: 'door',
      doorState: 'closed',
      move: 'normal',
      sense: 'normal',
      sound: 'normal',
      light: 'normal',
      dir: 'both'
    });
  });
});
