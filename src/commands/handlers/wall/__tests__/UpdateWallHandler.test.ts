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
    move: 1,
    sense: 1,
    sound: 1,
    light: 1,
    dir: 0,
    update: jest.fn(),
    ...overrides
  };
  (wall.update as jest.Mock).mockResolvedValue(wall);
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
    (wall.update as jest.Mock).mockResolvedValue({ ...wall, ds: 1 });
    mockGame.scenes.active = makeMockScene('active', wall);

    const result = await updateWallHandler({ wallId: 'w1', doorState: 'open' });

    expect(wall.update).toHaveBeenCalledWith({ ds: 1 });
    expect(result.doorState).toBe('open');
  });

  it('updates multiple fields together', async () => {
    const wall = makeMockWall({ _id: 'w1' });
    (wall.update as jest.Mock).mockResolvedValue({
      ...wall,
      door: 2,
      ds: 2,
      move: 0,
      sense: 2,
      sound: 0,
      light: 0,
      dir: 1
    });
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
      sense: 2,
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

  it('partial update: only door type', async () => {
    const wall = makeMockWall({ _id: 'w1', door: 0 });
    (wall.update as jest.Mock).mockResolvedValue({ ...wall, door: 1 });
    mockGame.scenes.active = makeMockScene('active', wall);

    await updateWallHandler({ wallId: 'w1', door: 'door' });

    expect(wall.update).toHaveBeenCalledWith({ door: 1 });
  });

  it('updates coordinates c', async () => {
    const wall = makeMockWall({ _id: 'w1', c: [0, 0, 100, 100] });
    (wall.update as jest.Mock).mockResolvedValue({ ...wall, c: [50, 50, 200, 200] });
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
    const wall = makeMockWall({ _id: 'w1' });
    (wall.update as jest.Mock).mockResolvedValue({
      ...wall,
      door: 0,
      ds: 0,
      move: 1,
      sense: 1,
      sound: 1,
      light: 1,
      dir: 2
    });
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
});
