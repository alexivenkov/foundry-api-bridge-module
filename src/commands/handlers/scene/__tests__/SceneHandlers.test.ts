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
  c: number[];
  move: number;
  sense: number;
  door: number;
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
  tokens: { contents: { id: string }[] };
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
  c: [0, 0, 100, 100],
  move: 20,
  sense: 20,
  door: 0,
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
  tokens: { contents: [{ id: 'token-1' }, { id: 'token-2' }] },
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

      expect(result).toEqual({
        id: 'scene-123',
        name: 'Test Scene',
        active: true,
        img: 'scenes/tavern.jpg',
        width: 4000,
        height: 3000,
        grid: { size: 100, type: 1, units: 'ft', distance: 5 },
        darkness: 0.3,
        notes: [{ x: 100, y: 200, text: 'A mysterious door', label: 'Door', entryId: 'journal-123' }],
        walls: [{ c: [0, 0, 100, 100], move: 20, sense: 20, door: 0 }],
        tokenCount: 2
      });
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

    it('handles scene with empty notes and walls', async () => {
      const mockScene = createMockScene({
        notes: { contents: [] },
        walls: { contents: [] },
        tokens: { contents: [] }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneHandler({});

      expect(result.notes).toEqual([]);
      expect(result.walls).toEqual([]);
      expect(result.tokenCount).toBe(0);
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
      expect(result.tokenCount).toBe(0);
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
        tokens: null,
        activate: jest.fn()
      } as unknown as MockScene;
      mockGame.scenes.active = sceneWithNulls;

      const result = await getSceneHandler({});

      expect(result.notes).toEqual([]);
      expect(result.walls).toEqual([]);
      expect(result.tokenCount).toBe(0);
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
      (scene as Record<string, unknown>).img = undefined;
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
