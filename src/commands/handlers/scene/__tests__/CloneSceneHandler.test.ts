import { cloneSceneHandler } from '../CloneSceneHandler';
import type { FoundrySceneCrud } from '../sceneTypes';

const mockClone = jest.fn();
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
    id: 'src-1',
    uuid: 'Scene.src-1',
    name: 'Source',
    active: false,
    width: 4000,
    height: 3000,
    background: { src: 'maps/orig.jpg' },
    navigation: false,
    navName: null,
    navOrder: 0,
    folder: null,
    grid: { type: 1, size: 100, distance: 5, units: 'ft' },
    update: jest.fn(),
    delete: jest.fn(),
    clone: mockClone,
    view: jest.fn(),
    ...overrides
  };
}

function makeClonedScene(overrides?: Partial<FoundrySceneCrud>): FoundrySceneCrud {
  return makeScene({
    id: 'clone-1',
    uuid: 'Scene.clone-1',
    name: 'Source (Copy)',
    ...overrides
  });
}

describe('cloneSceneHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setGame();
  });

  afterEach(clearGame);

  it('clones source scene with no overrides', async () => {
    mockGet.mockReturnValue(makeScene());
    mockClone.mockResolvedValue(makeClonedScene());

    const result = await cloneSceneHandler({ sourceId: 'src-1' });

    expect(mockGet).toHaveBeenCalledWith('src-1');
    expect(mockClone).toHaveBeenCalledWith({}, { save: true });
    expect(result.id).toBe('clone-1');
    expect(result.uuid).toBe('Scene.clone-1');
    expect(result.name).toBe('Source (Copy)');
  });

  it('clones with name override', async () => {
    mockGet.mockReturnValue(makeScene());
    mockClone.mockResolvedValue(makeClonedScene({ name: 'My Custom Name' }));

    const result = await cloneSceneHandler({ sourceId: 'src-1', name: 'My Custom Name' });

    expect(mockClone).toHaveBeenCalledWith({ name: 'My Custom Name' }, { save: true });
    expect(result.name).toBe('My Custom Name');
  });

  it('clones with folder override', async () => {
    mockGet.mockReturnValue(makeScene());
    mockClone.mockResolvedValue(makeClonedScene({ folder: { id: 'f1', name: 'Maps' } }));

    const result = await cloneSceneHandler({ sourceId: 'src-1', folder: 'f1' });

    expect(mockClone).toHaveBeenCalledWith({ folder: 'f1' }, { save: true });
    expect(result.folder).toBe('Maps');
  });

  it('clones with both name and folder overrides', async () => {
    mockGet.mockReturnValue(makeScene());
    mockClone.mockResolvedValue(makeClonedScene({ name: 'X', folder: { id: 'f2', name: 'F2' } }));

    await cloneSceneHandler({ sourceId: 'src-1', name: 'X', folder: 'f2' });

    expect(mockClone).toHaveBeenCalledWith({ name: 'X', folder: 'f2' }, { save: true });
  });

  it('throws when source scene not found', async () => {
    mockGet.mockReturnValue(undefined);

    await expect(cloneSceneHandler({ sourceId: 'missing' }))
      .rejects.toThrow('Source scene not found: missing');

    expect(mockClone).not.toHaveBeenCalled();
  });

  it('always passes { save: true } to scene.clone()', async () => {
    mockGet.mockReturnValue(makeScene());
    mockClone.mockResolvedValue(makeClonedScene());

    await cloneSceneHandler({ sourceId: 'src-1' });

    const optionsArg = mockClone.mock.calls[0]?.[1] as { save?: boolean };
    expect(optionsArg).toEqual({ save: true });
  });
});
