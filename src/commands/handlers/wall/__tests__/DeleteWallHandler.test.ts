import { deleteWallHandler } from '../DeleteWallHandler';
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

const makeMockWall = (id = 'wall-1'): FoundryWallDocument => ({
  _id: id,
  c: [0, 0, 100, 100],
  door: 0,
  ds: 0,
  move: 1,
  sense: 1,
  sound: 1,
  light: 1,
  dir: 0,
  update: jest.fn()
});

const makeMockScene = (id = 'scene-1', wall?: FoundryWallDocument): MockScene => ({
  id,
  walls: {
    get: jest.fn().mockReturnValue(wall),
    contents: wall ? [wall] : []
  },
  createEmbeddedDocuments: jest.fn(),
  deleteEmbeddedDocuments: jest.fn().mockResolvedValue([])
});

const mockGame = {
  scenes: {
    get: jest.fn() as jest.Mock,
    active: null as MockScene | null
  }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

describe('deleteWallHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = null;
    mockGame.scenes.get.mockReturnValue(undefined);
  });

  it('deletes a wall and returns deletion confirmation', async () => {
    const wall = makeMockWall('w-doomed');
    mockGame.scenes.active = makeMockScene('active-scene', wall);

    const result = await deleteWallHandler({ wallId: 'w-doomed' });

    expect(mockGame.scenes.active!.deleteEmbeddedDocuments)
      .toHaveBeenCalledWith('Wall', ['w-doomed']);
    expect(result).toEqual({
      deleted: true,
      wallId: 'w-doomed',
      sceneId: 'active-scene'
    });
  });

  it('uses scene specified by sceneId', async () => {
    const wall = makeMockWall('w-1');
    const specificScene = makeMockScene('specific-scene', wall);
    mockGame.scenes.get.mockReturnValue(specificScene);

    const result = await deleteWallHandler({ sceneId: 'specific-scene', wallId: 'w-1' });

    expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
    expect(specificScene.deleteEmbeddedDocuments).toHaveBeenCalledWith('Wall', ['w-1']);
    expect(result.sceneId).toBe('specific-scene');
  });

  it('throws when wall not found', async () => {
    const scene = makeMockScene('active');
    scene.walls.get.mockReturnValue(undefined);
    mockGame.scenes.active = scene;

    await expect(deleteWallHandler({ wallId: 'missing' }))
      .rejects.toThrow('Wall not found: missing');
    expect(scene.deleteEmbeddedDocuments).not.toHaveBeenCalled();
  });

  it('throws when scene not found', async () => {
    mockGame.scenes.get.mockReturnValue(undefined);

    await expect(deleteWallHandler({ sceneId: 'missing-scene', wallId: 'w1' }))
      .rejects.toThrow('Scene not found: missing-scene');
  });
});
