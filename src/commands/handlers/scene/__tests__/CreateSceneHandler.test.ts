import { createSceneHandler } from '../CreateSceneHandler';
import type { FoundrySceneCrud } from '../sceneTypes';
import type { SceneGridType } from '@/commands/types';

const mockCreate = jest.fn();

function setSceneClass(): void {
  (globalThis as Record<string, unknown>)['Scene'] = {
    create: mockCreate
  };
}

function clearSceneClass(): void {
  delete (globalThis as Record<string, unknown>)['Scene'];
}

function makeReturnedScene(overrides?: Partial<FoundrySceneCrud>): FoundrySceneCrud {
  return {
    id: 'scene-1',
    uuid: 'Scene.scene-1',
    name: 'New Scene',
    active: false,
    width: 4000,
    height: 3000,
    background: { src: 'maps/forest.jpg' },
    navigation: true,
    navName: null,
    navOrder: 0,
    folder: null,
    grid: { type: 1, size: 100, distance: 5, units: 'ft' },
    update: jest.fn(),
    delete: jest.fn(),
    clone: jest.fn(),
    view: jest.fn(),
    ...overrides
  };
}

describe('createSceneHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setSceneClass();
  });

  afterEach(clearSceneClass);

  it('creates scene with only name (minimal payload)', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene({ id: 'min-1', name: 'Minimal' }));

    const result = await createSceneHandler({ name: 'Minimal' });

    expect(mockCreate).toHaveBeenCalledWith({ name: 'Minimal' });
    expect(result.id).toBe('min-1');
    expect(result.name).toBe('Minimal');
    expect(result.uuid).toBe('Scene.scene-1');
    expect(result.active).toBe(false);
  });

  it('creates scene with width and height', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene({ width: 5000, height: 4000 }));

    const result = await createSceneHandler({ name: 'Sized', width: 5000, height: 4000 });

    expect(mockCreate).toHaveBeenCalledWith({ name: 'Sized', width: 5000, height: 4000 });
    expect(result.width).toBe(5000);
    expect(result.height).toBe(4000);
  });

  it('creates scene with full grid config (all 4 fields)', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene({
      grid: { type: 2, size: 75, distance: 1.5, units: 'm' }
    }));

    await createSceneHandler({
      name: 'Hex',
      grid: { type: 'hexPointyOdd', size: 75, distance: 1.5, units: 'm' }
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Hex',
      grid: { type: 2, size: 75, distance: 1.5, units: 'm' }
    });
  });

  it('wraps background in { src: ... } object', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene({ background: { src: 'maps/cave.jpg' } }));

    await createSceneHandler({ name: 'Cave', background: 'maps/cave.jpg' });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Cave',
      background: { src: 'maps/cave.jpg' }
    });
  });

  it('passes foreground, padding, fogExploration, darkness directly', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene());

    await createSceneHandler({
      name: 'FX',
      foreground: 'fx/overlay.webp',
      padding: 0.25,
      fogExploration: true,
      darkness: 0.6
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'FX',
      foreground: 'fx/overlay.webp',
      padding: 0.25,
      fogExploration: true,
      darkness: 0.6
    });
  });

  it('passes navigation flags (navigation, navName, navOrder)', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene({ navigation: true, navName: 'Forest', navOrder: 3 }));

    const result = await createSceneHandler({
      name: 'Forest Glade',
      navigation: true,
      navName: 'Forest',
      navOrder: 3
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Forest Glade',
      navigation: true,
      navName: 'Forest',
      navOrder: 3
    });
    expect(result.navigation).toBe(true);
    expect(result.navName).toBe('Forest');
    expect(result.navOrder).toBe(3);
  });

  it('passes folder when provided', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene({ folder: { id: 'f1', name: 'Maps' } }));

    const result = await createSceneHandler({ name: 'Foldered', folder: 'f1' });

    expect(mockCreate).toHaveBeenCalledWith({ name: 'Foldered', folder: 'f1' });
    expect(result.folder).toBe('Maps');
  });

  it('maps every grid type wire string to correct number', async () => {
    const cases: Array<{ wire: SceneGridType; num: number }> = [
      { wire: 'gridless', num: 0 },
      { wire: 'square', num: 1 },
      { wire: 'hexPointyOdd', num: 2 },
      { wire: 'hexPointyEven', num: 3 },
      { wire: 'hexFlatOdd', num: 4 },
      { wire: 'hexFlatEven', num: 5 }
    ];

    for (const { wire, num } of cases) {
      jest.clearAllMocks();
      mockCreate.mockResolvedValue(makeReturnedScene({ grid: { type: num, size: 100, distance: 5, units: 'ft' } }));

      await createSceneHandler({ name: `Grid-${wire}`, grid: { type: wire } });

      const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
      expect((call['grid'] as Record<string, unknown>)['type']).toBe(num);
    }
  });

  it('maps grid number back to wire string in result', async () => {
    const cases: Array<{ wire: SceneGridType; num: number }> = [
      { wire: 'gridless', num: 0 },
      { wire: 'square', num: 1 },
      { wire: 'hexPointyOdd', num: 2 },
      { wire: 'hexPointyEven', num: 3 },
      { wire: 'hexFlatOdd', num: 4 },
      { wire: 'hexFlatEven', num: 5 }
    ];

    for (const { wire, num } of cases) {
      jest.clearAllMocks();
      mockCreate.mockResolvedValue(makeReturnedScene({ grid: { type: num, size: 100, distance: 5, units: 'ft' } }));

      const result = await createSceneHandler({ name: 'X' });

      expect(result.grid.type).toBe(wire);
    }
  });

  it('does not include optional fields when undefined (defaults applied by Foundry)', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene());

    await createSceneHandler({ name: 'Bare' });

    const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('width');
    expect(call).not.toHaveProperty('height');
    expect(call).not.toHaveProperty('grid');
    expect(call).not.toHaveProperty('background');
    expect(call).not.toHaveProperty('foreground');
    expect(call).not.toHaveProperty('padding');
    expect(call).not.toHaveProperty('navigation');
    expect(call).not.toHaveProperty('navName');
    expect(call).not.toHaveProperty('navOrder');
    expect(call).not.toHaveProperty('fogExploration');
    expect(call).not.toHaveProperty('darkness');
    expect(call).not.toHaveProperty('folder');
  });

  it('omits grid object when no grid sub-fields provided', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene());

    await createSceneHandler({ name: 'X', grid: {} });

    const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('grid');
  });

  it('passes partial grid (size only) without other fields', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene());

    await createSceneHandler({ name: 'X', grid: { size: 50 } });

    const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call['grid']).toEqual({ size: 50 });
  });

  it('result includes background extracted from scene', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene({ background: { src: 'maps/forest.jpg' } }));

    const result = await createSceneHandler({ name: 'X' });

    expect(result.background).toBe('maps/forest.jpg');
  });

  it('result has null background when scene has null background', async () => {
    mockCreate.mockResolvedValue(makeReturnedScene({ background: null }));

    const result = await createSceneHandler({ name: 'X' });

    expect(result.background).toBeNull();
  });
});
