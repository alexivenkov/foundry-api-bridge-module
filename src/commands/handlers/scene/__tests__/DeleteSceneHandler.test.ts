import { deleteSceneHandler } from '../DeleteSceneHandler';
import type { FoundrySceneCrud } from '../sceneTypes';

const mockDelete = jest.fn();
const mockGet = jest.fn();

function setGame(): void {
  (globalThis as Record<string, unknown>)['game'] = {
    scenes: { get: mockGet }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

function makeScene(overrides?: Partial<FoundrySceneCrud>): FoundrySceneCrud {
  return {
    id: 'scene-1',
    uuid: 'Scene.scene-1',
    name: 'Doomed',
    active: false,
    width: 4000,
    height: 3000,
    background: null,
    navigation: false,
    navName: null,
    navOrder: 0,
    folder: null,
    grid: { type: 1, size: 100, distance: 5, units: 'ft' },
    update: jest.fn(),
    delete: mockDelete,
    clone: jest.fn(),
    view: jest.fn(),
    ...overrides
  };
}

describe('deleteSceneHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setGame();
  });

  afterEach(clearGame);

  it('deletes the scene and returns deleted: true with sceneId', async () => {
    mockGet.mockReturnValue(makeScene());
    mockDelete.mockResolvedValue(undefined);

    const result = await deleteSceneHandler({ sceneId: 'scene-1' });

    expect(mockGet).toHaveBeenCalledWith('scene-1');
    expect(mockDelete).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true, sceneId: 'scene-1' });
  });

  it('throws when scene not found', async () => {
    mockGet.mockReturnValue(undefined);

    await expect(deleteSceneHandler({ sceneId: 'nonexistent' }))
      .rejects.toThrow('Scene not found: nonexistent');

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('propagates delete() rejection', async () => {
    mockGet.mockReturnValue(makeScene());
    mockDelete.mockRejectedValue(new Error('Permission denied'));

    await expect(deleteSceneHandler({ sceneId: 'scene-1' }))
      .rejects.toThrow('Permission denied');
  });
});
