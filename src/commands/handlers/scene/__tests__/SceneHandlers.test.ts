import { getSceneHandler } from '@/commands/handlers/scene/GetSceneHandler';
import { getScenesListHandler } from '@/commands/handlers/scene/GetScenesListHandler';
import { activateSceneHandler } from '@/commands/handlers/scene/ActivateSceneHandler';

interface MockNote {
  x: number;
  y: number;
  text: string;
  label: string;
  entryId: string | null;
}

interface MockWall {
  _id: string;
  c: number[];
  move: number;
  sense: number;
  door: number;
  ds: number;
}

interface MockLight {
  x: number;
  y: number;
  config: { bright: number; dim: number; color: string | null; angle: number };
  walls: boolean;
  hidden: boolean;
}

interface MockTile {
  x: number;
  y: number;
  width: number;
  height: number;
  texture: { src: string };
  hidden: boolean;
  elevation: number;
  rotation: number;
}

interface MockDrawing {
  x: number;
  y: number;
  shape: { type: string; width: number; height: number; points: number[] };
  text: string;
  hidden: boolean;
  fillColor: string | null;
  strokeColor: string | null;
}

interface MockRegion {
  id: string;
  name: string;
  color: string | null;
  shapes: { type: string }[];
}

interface MockTokenActor {
  id: string;
  system?: { attributes?: { hp?: { value: number; max: number }; ac?: { value: number } } };
  statuses?: Set<string>;
}

interface MockToken {
  id: string;
  name: string;
  x: number;
  y: number;
  elevation: number;
  hidden: boolean;
  disposition: number;
  actor: MockTokenActor | null;
}

interface MockScene {
  id: string;
  name: string;
  active: boolean;
  img: string;
  width: number;
  height: number;
  grid: { size: number; type: number; units: string; distance: number };
  darkness: number;
  notes: { contents: MockNote[] };
  walls: { contents: MockWall[] };
  lights: { contents: MockLight[] };
  tiles: { contents: MockTile[] };
  drawings: { contents: MockDrawing[] };
  regions: { contents: MockRegion[] };
  tokens: { contents: MockToken[] };
  activate: jest.Mock;
}

const createMockNote = (overrides: Partial<MockNote> = {}): MockNote => ({
  x: 100,
  y: 200,
  text: 'A mysterious door',
  label: 'Door',
  entryId: 'journal-123',
  ...overrides
});

const createMockWall = (overrides: Partial<MockWall> = {}): MockWall => ({
  _id: 'wall-001',
  c: [0, 0, 100, 100],
  move: 20,
  sense: 20,
  door: 0,
  ds: 0,
  ...overrides
});

const createMockLight = (overrides: Partial<MockLight> = {}): MockLight => ({
  x: 500,
  y: 500,
  config: { bright: 30, dim: 60, color: '#ff9900', angle: 360 },
  walls: true,
  hidden: false,
  ...overrides
});

const createMockTile = (overrides: Partial<MockTile> = {}): MockTile => ({
  x: 200,
  y: 300,
  width: 100,
  height: 100,
  texture: { src: 'tiles/table.png' },
  hidden: false,
  elevation: 0,
  rotation: 0,
  ...overrides
});

const createMockDrawing = (overrides: Partial<MockDrawing> = {}): MockDrawing => ({
  x: 400,
  y: 400,
  shape: { type: 'r', width: 200, height: 100, points: [] },
  text: '',
  hidden: false,
  fillColor: '#00ff00',
  strokeColor: '#000000',
  ...overrides
});

const createMockRegion = (overrides: Partial<MockRegion> = {}): MockRegion => ({
  id: 'region-1',
  name: 'Trap Zone',
  color: '#ff0000',
  shapes: [{ type: 'rectangle' }],
  ...overrides
});

const createMockToken = (overrides: Partial<MockToken> = {}): MockToken => ({
  id: 'token-1',
  name: 'Goblin',
  x: 250,
  y: 350,
  elevation: 0,
  hidden: false,
  disposition: -1,
  actor: {
    id: 'actor-1',
    system: { attributes: { hp: { value: 7, max: 7 }, ac: { value: 13 } } },
    statuses: new Set<string>()
  },
  ...overrides
});

const createMockScene = (overrides: Partial<MockScene> = {}): MockScene => ({
  id: 'scene-123',
  name: 'Test Scene',
  active: true,
  img: 'scenes/tavern.jpg',
  width: 4000,
  height: 3000,
  grid: { size: 100, type: 1, units: 'ft', distance: 5 },
  darkness: 0.3,
  notes: { contents: [createMockNote()] },
  walls: { contents: [createMockWall()] },
  lights: { contents: [createMockLight()] },
  tiles: { contents: [createMockTile()] },
  drawings: { contents: [createMockDrawing()] },
  regions: { contents: [createMockRegion()] },
  tokens: { contents: [createMockToken(), createMockToken({ id: 'token-2', name: 'Fighter', x: 500, y: 500, disposition: 1, actor: { id: 'actor-2', system: { attributes: { hp: { value: 7, max: 7 }, ac: { value: 13 } } }, statuses: new Set<string>() } })] },
  activate: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

const mockGame: {
  scenes: {
    get: jest.Mock;
    active: MockScene | null;
    forEach: jest.Mock;
  };
} = {
  scenes: {
    get: jest.fn(),
    active: null,
    forEach: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('Scene Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = null;
  });

  describe('getSceneHandler', () => {
    it('returns detail for active scene', async () => {
      const mockScene = createMockScene();
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result).toMatchObject({
        id: 'scene-123',
        name: 'Test Scene',
        active: true,
        img: 'scenes/tavern.jpg',
        width: 4000,
        height: 3000,
        grid: { size: 100, type: 1, units: 'ft', distance: 5 },
        darkness: 0.3,
        notes: [{ x: 100, y: 200, text: 'A mysterious door', label: 'Door', entryId: 'journal-123' }],
        walls: [{ id: 'wall-001', c: [0, 0, 100, 100], move: 20, sense: 20, door: 0, ds: 0 }],
        lights: [{ x: 500, y: 500, bright: 30, dim: 60, color: '#ff9900', angle: 360, walls: true, hidden: false }],
        tiles: [{ x: 200, y: 300, width: 100, height: 100, img: 'tiles/table.png', hidden: false, elevation: 0, rotation: 0 }],
        drawings: [{ x: 400, y: 400, shape: { type: 'r', width: 200, height: 100, points: [] }, text: '', hidden: false, fillColor: '#00ff00', strokeColor: '#000000' }],
        regions: [{ id: 'region-1', name: 'Trap Zone', color: '#ff0000', shapes: [{ type: 'rectangle' }] }],
        tokens: [
          { id: 'token-1', name: 'Goblin', actorId: 'actor-1', gridX: 2, gridY: 3, x: 250, y: 350, elevation: 0, hidden: false, disposition: -1, hp: { value: 7, max: 7 }, ac: 13, conditions: [] },
          { id: 'token-2', name: 'Fighter', actorId: 'actor-2', gridX: 5, gridY: 5, x: 500, y: 500, elevation: 0, hidden: false, disposition: 1, hp: { value: 7, max: 7 }, ac: 13, conditions: [] }
        ]
      });
      expect(typeof result.asciiMap).toBe('string');
    });

    it('returns detail for scene by ID', async () => {
      const mockScene = createMockScene({ id: 'specific-scene', name: 'Specific Scene' });
      mockGame.scenes.get.mockReturnValue(mockScene);

      const result = await getSceneHandler({ sceneId: 'specific-scene' });

      expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
      expect(result.id).toBe('specific-scene');
      expect(result.name).toBe('Specific Scene');
    });

    it('throws when no active scene', async () => {
      mockGame.scenes.active = null;

      await expect(getSceneHandler({})).rejects.toThrow('No active scene');
    });

    it('throws when scene not found by ID', async () => {
      mockGame.scenes.get.mockReturnValue(undefined);

      await expect(getSceneHandler({ sceneId: 'nonexistent' }))
        .rejects.toThrow('Scene not found: nonexistent');
    });

    it('handles scene with empty collections', async () => {
      const mockScene = createMockScene({
        notes: { contents: [] },
        walls: { contents: [] },
        lights: { contents: [] },
        tiles: { contents: [] },
        drawings: { contents: [] },
        regions: { contents: [] },
        tokens: { contents: [] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.notes).toEqual([]);
      expect(result.walls).toEqual([]);
      expect(result.lights).toEqual([]);
      expect(result.tiles).toEqual([]);
      expect(result.drawings).toEqual([]);
      expect(result.regions).toEqual([]);
      expect(result.tokens).toEqual([]);
    });

    it('includes multiple notes and walls', async () => {
      const mockScene = createMockScene({
        notes: {
          contents: [
            createMockNote({ x: 10, y: 20, text: 'Note 1', label: 'Label 1' }),
            createMockNote({ x: 30, y: 40, text: 'Note 2', label: 'Label 2', entryId: null })
          ]
        },
        walls: {
          contents: [
            createMockWall({ c: [0, 0, 100, 0] }),
            createMockWall({ c: [100, 0, 100, 100], door: 1 })
          ]
        }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.notes).toHaveLength(2);
      expect(result.walls).toHaveLength(2);
      expect(result.walls[1]?.door).toBe(1);
    });
  });

  describe('getScenesListHandler', () => {
    it('returns list of all scenes', async () => {
      const scene1 = createMockScene({ id: 'scene-1', name: 'Tavern', active: true });
      const scene2 = createMockScene({ id: 'scene-2', name: 'Dungeon', active: false, img: 'scenes/dungeon.jpg' });
      mockGame.scenes.forEach.mockImplementation((fn: (scene: MockScene) => void) => {
        fn(scene1);
        fn(scene2);
      });

      const result = await getScenesListHandler({} as Record<string, never>);

      expect(result.scenes).toEqual([
        { id: 'scene-1', name: 'Tavern', active: true, img: 'scenes/tavern.jpg' },
        { id: 'scene-2', name: 'Dungeon', active: false, img: 'scenes/dungeon.jpg' }
      ]);
    });

    it('returns empty list when no scenes', async () => {
      mockGame.scenes.forEach.mockImplementation(() => {});

      const result = await getScenesListHandler({} as Record<string, never>);

      expect(result.scenes).toEqual([]);
    });
  });

  describe('getSceneHandler - edge cases', () => {
    it('falls back to defaults when scene has undefined properties', async () => {
      const sparseScene = {
        id: 'sparse',
        name: 'Sparse Scene',
        active: false,
        img: undefined,
        width: undefined,
        height: undefined,
        grid: { size: undefined, type: undefined, units: undefined, distance: undefined },
        darkness: undefined,
        notes: undefined,
        walls: undefined,
        lights: undefined,
        tiles: undefined,
        drawings: undefined,
        regions: undefined,
        tokens: undefined,
        activate: jest.fn()
      } as unknown as MockScene;
      mockGame.scenes.active = sparseScene;

      const result = await getSceneHandler({});

      expect(result.img).toBe('');
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
      expect(result.grid).toEqual({ size: 100, type: 1, units: 'ft', distance: 5 });
      expect(result.darkness).toBe(0);
      expect(result.notes).toEqual([]);
      expect(result.walls).toEqual([]);
      expect(result.lights).toEqual([]);
      expect(result.tiles).toEqual([]);
      expect(result.drawings).toEqual([]);
      expect(result.regions).toEqual([]);
      expect(result.tokens).toEqual([]);
    });

    it('handles null notes and walls collections', async () => {
      const sceneWithNulls = {
        id: 'null-scene',
        name: 'Null Collections',
        active: true,
        img: 'img.jpg',
        width: 1000,
        height: 1000,
        grid: { size: 100, type: 1, units: 'ft', distance: 5 },
        darkness: 0,
        notes: null,
        walls: null,
        lights: null,
        tiles: null,
        drawings: null,
        regions: null,
        tokens: null,
        activate: jest.fn()
      } as unknown as MockScene;
      mockGame.scenes.active = sceneWithNulls;

      const result = await getSceneHandler({});

      expect(result.notes).toEqual([]);
      expect(result.walls).toEqual([]);
      expect(result.lights).toEqual([]);
      expect(result.tiles).toEqual([]);
      expect(result.drawings).toEqual([]);
      expect(result.regions).toEqual([]);
      expect(result.tokens).toEqual([]);
    });

    it('handles note with null entryId (unlinked note)', async () => {
      const mockScene = createMockScene({
        notes: { contents: [createMockNote({ entryId: null })] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.notes[0]?.entryId).toBeNull();
    });

    it('handles note with undefined text and label', async () => {
      const noteWithUndefined = { x: 50, y: 50, text: undefined, label: undefined, entryId: null } as unknown as MockNote;
      const mockScene = createMockScene({
        notes: { contents: [noteWithUndefined] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.notes[0]).toEqual({ x: 50, y: 50, text: '', label: '', entryId: null });
    });

    it('handles hex grid type', async () => {
      const mockScene = createMockScene({
        grid: { size: 75, type: 2, units: 'm', distance: 1.5 }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.grid).toEqual({ size: 75, type: 2, units: 'm', distance: 1.5 });
    });

    it('handles full darkness', async () => {
      const mockScene = createMockScene({ darkness: 1 });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.darkness).toBe(1);
    });

    it('handles zero darkness', async () => {
      const mockScene = createMockScene({ darkness: 0 });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.darkness).toBe(0);
    });

    it('handles wall with door type', async () => {
      const mockScene = createMockScene({
        walls: {
          contents: [
            createMockWall({ door: 0 }),
            createMockWall({ door: 1, c: [200, 200, 300, 200] }),
            createMockWall({ door: 2, c: [400, 400, 500, 400] })
          ]
        }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.walls).toHaveLength(3);
      expect(result.walls[0]?.door).toBe(0);
      expect(result.walls[1]?.door).toBe(1);
      expect(result.walls[2]?.door).toBe(2);
    });

    it('handles wall with different move/sense blocking', async () => {
      const mockScene = createMockScene({
        walls: {
          contents: [
            createMockWall({ move: 20, sense: 20 }),
            createMockWall({ move: 0, sense: 20 }),
            createMockWall({ move: 20, sense: 0 })
          ]
        }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.walls[0]).toMatchObject({ move: 20, sense: 20 });
      expect(result.walls[1]).toMatchObject({ move: 0, sense: 20 });
      expect(result.walls[2]).toMatchObject({ move: 20, sense: 0 });
    });

    it('handles large number of notes and walls', async () => {
      const notes = Array.from({ length: 50 }, (_, i) =>
        createMockNote({ x: i * 100, y: i * 100, label: `Note ${i}` })
      );
      const walls = Array.from({ length: 200 }, (_, i) =>
        createMockWall({ c: [i, 0, i + 100, 0] })
      );
      const mockScene = createMockScene({
        notes: { contents: notes },
        walls: { contents: walls }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.notes).toHaveLength(50);
      expect(result.walls).toHaveLength(200);
    });

    it('prefers sceneId over active scene', async () => {
      const activeScene = createMockScene({ id: 'active', name: 'Active' });
      const targetScene = createMockScene({ id: 'target', name: 'Target' });
      mockGame.scenes.active = activeScene;
      mockGame.scenes.get.mockReturnValue(targetScene);

      const result = await getSceneHandler({ sceneId: 'target' });

      expect(result.id).toBe('target');
      expect(result.name).toBe('Target');
    });
  });

  describe('getScenesListHandler - edge cases', () => {
    it('handles scene with empty img', async () => {
      const scene = createMockScene({ img: '' });
      mockGame.scenes.forEach.mockImplementation((fn: (scene: MockScene) => void) => fn(scene));

      const result = await getScenesListHandler({} as Record<string, never>);

      expect(result.scenes[0]?.img).toBe('');
    });

    it('handles scene with undefined img', async () => {
      const scene = createMockScene();
      (scene as unknown as Record<string, unknown>)['img'] = undefined;
      mockGame.scenes.forEach.mockImplementation((fn: (scene: MockScene) => void) => fn(scene));

      const result = await getScenesListHandler({} as Record<string, never>);

      expect(result.scenes[0]?.img).toBe('');
    });

    it('preserves scene order from forEach', async () => {
      const scenes = ['Alpha', 'Beta', 'Gamma'].map((name, i) =>
        createMockScene({ id: `scene-${i}`, name, active: i === 0 })
      );
      mockGame.scenes.forEach.mockImplementation((fn: (scene: MockScene) => void) => {
        scenes.forEach(fn);
      });

      const result = await getScenesListHandler({} as Record<string, never>);

      expect(result.scenes.map(s => s.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    it('includes only summary fields, not detail fields', async () => {
      const scene = createMockScene();
      mockGame.scenes.forEach.mockImplementation((fn: (scene: MockScene) => void) => fn(scene));

      const result = await getScenesListHandler({} as Record<string, never>);

      const summary = result.scenes[0];
      expect(Object.keys(summary ?? {})).toEqual(['id', 'name', 'active', 'img']);
    });
  });

  describe('getSceneHandler - lights, tiles, drawings, regions, tokens', () => {
    it('maps lights with config', async () => {
      const mockScene = createMockScene({
        lights: { contents: [
          createMockLight({ x: 100, y: 200, config: { bright: 20, dim: 40, color: '#ffffff', angle: 90 }, walls: false, hidden: true })
        ] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.lights[0]).toEqual({ x: 100, y: 200, bright: 20, dim: 40, color: '#ffffff', angle: 90, walls: false, hidden: true });
    });

    it('maps tiles with texture', async () => {
      const mockScene = createMockScene({
        tiles: { contents: [
          createMockTile({ x: 0, y: 0, width: 512, height: 512, texture: { src: 'tiles/chest.png' }, elevation: 5, rotation: 45 })
        ] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.tiles[0]).toEqual({ x: 0, y: 0, width: 512, height: 512, img: 'tiles/chest.png', hidden: false, elevation: 5, rotation: 45 });
    });

    it('maps drawings with shape', async () => {
      const mockScene = createMockScene({
        drawings: { contents: [
          createMockDrawing({ shape: { type: 'p', width: 0, height: 0, points: [0, 0, 100, 0, 100, 100] }, text: 'Triangle' })
        ] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.drawings[0]?.shape.type).toBe('p');
      expect(result.drawings[0]?.shape.points).toEqual([0, 0, 100, 0, 100, 100]);
      expect(result.drawings[0]?.text).toBe('Triangle');
    });

    it('maps regions with shapes', async () => {
      const mockScene = createMockScene({
        regions: { contents: [
          createMockRegion({ id: 'r1', name: 'Throne Room', shapes: [{ type: 'rectangle' }, { type: 'circle' }] })
        ] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.regions[0]).toEqual({ id: 'r1', name: 'Throne Room', color: '#ff0000', shapes: [{ type: 'rectangle' }, { type: 'circle' }] });
    });

    it('converts token pixel positions to grid coordinates', async () => {
      const mockScene = createMockScene({
        grid: { size: 100, type: 1, units: 'ft', distance: 5 },
        tokens: { contents: [
          createMockToken({ id: 't1', x: 250, y: 350 }),
          createMockToken({ id: 't2', x: 0, y: 0 }),
          createMockToken({ id: 't3', x: 99, y: 199 })
        ] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.tokens[0]).toMatchObject({ id: 't1', gridX: 2, gridY: 3 });
      expect(result.tokens[1]).toMatchObject({ id: 't2', gridX: 0, gridY: 0 });
      expect(result.tokens[2]).toMatchObject({ id: 't3', gridX: 0, gridY: 1 });
    });

    it('includes token actorId, disposition, hidden', async () => {
      const mockScene = createMockScene({
        tokens: { contents: [
          createMockToken({ actor: { id: 'actor-abc' }, disposition: 1, hidden: true })
        ] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.tokens[0]).toMatchObject({ actorId: 'actor-abc', disposition: 1, hidden: true });
    });

    it('handles token with null actor', async () => {
      const mockScene = createMockScene({
        tokens: { contents: [createMockToken({ actor: null })] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.tokens[0]?.actorId).toBeNull();
    });

    it('uses grid size for grid coordinate calculation', async () => {
      const mockScene = createMockScene({
        grid: { size: 50, type: 1, units: 'ft', distance: 5 },
        tokens: { contents: [createMockToken({ x: 150, y: 250 })] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.tokens[0]).toMatchObject({ gridX: 3, gridY: 5 });
    });
  });

  describe('activateSceneHandler', () => {
    it('activates scene and returns result', async () => {
      const mockScene = createMockScene({ id: 'scene-to-activate', name: 'New Scene' });
      mockGame.scenes.get.mockReturnValue(mockScene);

      const result = await activateSceneHandler({ sceneId: 'scene-to-activate' });

      expect(mockScene.activate).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'scene-to-activate',
        name: 'New Scene',
        active: true
      });
    });

    it('throws when scene not found', async () => {
      mockGame.scenes.get.mockReturnValue(undefined);

      await expect(activateSceneHandler({ sceneId: 'nonexistent' }))
        .rejects.toThrow('Scene not found: nonexistent');
    });

    it('propagates error when activate() rejects', async () => {
      const mockScene = createMockScene();
      mockScene.activate.mockRejectedValue(new Error('Permission denied'));
      mockGame.scenes.get.mockReturnValue(mockScene);

      await expect(activateSceneHandler({ sceneId: 'scene-123' }))
        .rejects.toThrow('Permission denied');
    });

    it('always returns active: true after activation', async () => {
      const mockScene = createMockScene({ active: false });
      mockGame.scenes.get.mockReturnValue(mockScene);

      const result = await activateSceneHandler({ sceneId: 'scene-123' });

      expect(result.active).toBe(true);
    });
  });
});
