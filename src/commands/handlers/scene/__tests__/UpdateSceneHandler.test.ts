import { updateSceneHandler } from '../UpdateSceneHandler';
import type { FoundrySceneCrud } from '../sceneTypes';

const mockUpdate = jest.fn();
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
    name: 'Original',
    active: false,
    width: 4000,
    height: 3000,
    background: { src: 'maps/old.jpg' },
    navigation: false,
    navName: null,
    navOrder: 0,
    folder: null,
    grid: { type: 1, size: 100, distance: 5, units: 'ft' },
    update: mockUpdate,
    delete: jest.fn(),
    clone: jest.fn(),
    view: jest.fn(),
    ...overrides
  };
}

describe('updateSceneHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setGame();
  });

  afterEach(clearGame);

  it('updates scene name only', async () => {
    const scene = makeScene();
    mockGet.mockReturnValue(scene);
    mockUpdate.mockResolvedValue(makeScene({ name: 'Renamed' }));

    const result = await updateSceneHandler({ sceneId: 'scene-1', name: 'Renamed' });

    expect(mockGet).toHaveBeenCalledWith('scene-1');
    expect(mockUpdate).toHaveBeenCalledWith({ name: 'Renamed' });
    expect(result.name).toBe('Renamed');
  });

  it('updates only the grid size in partial grid object', async () => {
    mockGet.mockReturnValue(makeScene());
    mockUpdate.mockResolvedValue(makeScene({ grid: { type: 1, size: 50, distance: 5, units: 'ft' } }));

    await updateSceneHandler({ sceneId: 'scene-1', grid: { size: 50 } });

    const call = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call['grid']).toEqual({ size: 50 });
    expect((call['grid'] as Record<string, unknown>)).not.toHaveProperty('type');
    expect((call['grid'] as Record<string, unknown>)).not.toHaveProperty('distance');
    expect((call['grid'] as Record<string, unknown>)).not.toHaveProperty('units');
  });

  it('clears navName when set to null', async () => {
    mockGet.mockReturnValue(makeScene({ navName: 'Old Nav' }));
    mockUpdate.mockResolvedValue(makeScene({ navName: null }));

    const result = await updateSceneHandler({ sceneId: 'scene-1', navName: null });

    expect(mockUpdate).toHaveBeenCalledWith({ navName: null });
    expect(result.navName).toBeNull();
  });

  it('moves scene to root when folder set to null', async () => {
    mockGet.mockReturnValue(makeScene({ folder: { id: 'f1', name: 'Maps' } }));
    mockUpdate.mockResolvedValue(makeScene({ folder: null }));

    const result = await updateSceneHandler({ sceneId: 'scene-1', folder: null });

    expect(mockUpdate).toHaveBeenCalledWith({ folder: null });
    expect(result.folder).toBeNull();
  });

  it('updates darkness across boundary values 0 and 1', async () => {
    mockGet.mockReturnValue(makeScene());
    mockUpdate.mockResolvedValue(makeScene());

    await updateSceneHandler({ sceneId: 'scene-1', darkness: 0 });
    expect(mockUpdate).toHaveBeenLastCalledWith({ darkness: 0 });

    await updateSceneHandler({ sceneId: 'scene-1', darkness: 1 });
    expect(mockUpdate).toHaveBeenLastCalledWith({ darkness: 1 });
  });

  it('partial update with multiple fields combined', async () => {
    mockGet.mockReturnValue(makeScene());
    mockUpdate.mockResolvedValue(makeScene({
      name: 'Renamed',
      width: 5000,
      navigation: true,
      navName: 'X'
    }));

    await updateSceneHandler({
      sceneId: 'scene-1',
      name: 'Renamed',
      width: 5000,
      navigation: true,
      navName: 'X'
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'Renamed',
      width: 5000,
      navigation: true,
      navName: 'X'
    });
  });

  it('throws when scene not found', async () => {
    mockGet.mockReturnValue(undefined);

    await expect(updateSceneHandler({ sceneId: 'nonexistent', name: 'X' }))
      .rejects.toThrow('Scene not found: nonexistent');

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('wraps background string in { src: ... }', async () => {
    mockGet.mockReturnValue(makeScene());
    mockUpdate.mockResolvedValue(makeScene({ background: { src: 'maps/new.jpg' } }));

    await updateSceneHandler({ sceneId: 'scene-1', background: 'maps/new.jpg' });

    expect(mockUpdate).toHaveBeenCalledWith({ background: { src: 'maps/new.jpg' } });
  });

  it('maps grid type wire string to number when updating', async () => {
    mockGet.mockReturnValue(makeScene());
    mockUpdate.mockResolvedValue(makeScene({ grid: { type: 4, size: 100, distance: 5, units: 'ft' } }));

    await updateSceneHandler({ sceneId: 'scene-1', grid: { type: 'hexFlatOdd' } });

    const call = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect((call['grid'] as Record<string, unknown>)['type']).toBe(4);
  });

  it('omits grid object when grid provided but empty', async () => {
    mockGet.mockReturnValue(makeScene());
    mockUpdate.mockResolvedValue(makeScene());

    await updateSceneHandler({ sceneId: 'scene-1', grid: {} });

    const call = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('grid');
  });

  it('passes empty payload when no update fields provided', async () => {
    mockGet.mockReturnValue(makeScene());
    mockUpdate.mockResolvedValue(makeScene());

    await updateSceneHandler({ sceneId: 'scene-1' });

    expect(mockUpdate).toHaveBeenCalledWith({});
  });

  it('passes through height, foreground, padding, navOrder, fogExploration', async () => {
    mockGet.mockReturnValue(makeScene());
    mockUpdate.mockResolvedValue(makeScene());

    await updateSceneHandler({
      sceneId: 'scene-1',
      height: 2500,
      foreground: 'fx/clouds.webp',
      padding: 0.1,
      navOrder: 7,
      fogExploration: false
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      height: 2500,
      foreground: 'fx/clouds.webp',
      padding: 0.1,
      navOrder: 7,
      fogExploration: false
    });
  });

  it('passes grid distance and units when provided', async () => {
    mockGet.mockReturnValue(makeScene());
    mockUpdate.mockResolvedValue(makeScene());

    await updateSceneHandler({
      sceneId: 'scene-1',
      grid: { distance: 10, units: 'm' }
    });

    const call = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call['grid']).toEqual({ distance: 10, units: 'm' });
  });

  describe('v14 scene schema (environment/fog paths)', () => {
    it('writes darkness/fog as nested environment/fog objects on v14', async () => {
      (globalThis as Record<string, unknown>)['game'] = {
        scenes: { get: mockGet },
        release: { generation: 14 }
      };
      mockGet.mockReturnValue(makeScene());
      mockUpdate.mockResolvedValue(makeScene());

      await updateSceneHandler({ sceneId: 'scene-1', darkness: 0.4, fogExploration: false });

      expect(mockUpdate).toHaveBeenCalledWith({
        environment: { darknessLevel: 0.4 },
        fog: { exploration: false }
      });
    });
  });
});
