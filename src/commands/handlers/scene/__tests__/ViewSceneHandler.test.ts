import { viewSceneHandler } from '../ViewSceneHandler';
import type { FoundrySceneCrud } from '../sceneTypes';

const mockView = jest.fn();
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
    name: 'Viewable',
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
    delete: jest.fn(),
    clone: jest.fn(),
    view: mockView,
    ...overrides
  };
}

describe('viewSceneHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setGame();
  });

  afterEach(clearGame);

  it('views the scene and returns viewed: true with sceneId', async () => {
    mockGet.mockReturnValue(makeScene());
    mockView.mockResolvedValue(undefined);

    const result = await viewSceneHandler({ sceneId: 'scene-1' });

    expect(mockGet).toHaveBeenCalledWith('scene-1');
    expect(mockView).toHaveBeenCalled();
    expect(result).toEqual({ viewed: true, sceneId: 'scene-1' });
  });

  it('throws when scene not found', async () => {
    mockGet.mockReturnValue(undefined);

    await expect(viewSceneHandler({ sceneId: 'nonexistent' }))
      .rejects.toThrow('Scene not found: nonexistent');

    expect(mockView).not.toHaveBeenCalled();
  });

  it('propagates view() rejection', async () => {
    mockGet.mockReturnValue(makeScene());
    mockView.mockRejectedValue(new Error('Cannot view scene'));

    await expect(viewSceneHandler({ sceneId: 'scene-1' }))
      .rejects.toThrow('Cannot view scene');
  });
});
