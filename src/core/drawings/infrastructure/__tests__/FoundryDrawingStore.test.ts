import { SceneNotFoundError } from '../../../shared';
import { FoundryDrawingStore } from '../FoundryDrawingStore';
import type {
  FoundryDrawingDocument,
  FoundryDrawingGame,
  FoundryDrawingScene,
  FoundryDrawingSource
} from '../foundryDrawingTypes';

// Sources as the installed cores store them (probe of BaseDrawing#toObject).
const SOURCE_13: FoundryDrawingSource = {
  _id: 'box',
  author: 'bbbbbbbbbbbbbbbb',
  shape: { type: 'r', width: 200, height: 100, points: [] },
  x: 10,
  y: 20,
  elevation: 2,
  sort: 3,
  rotation: 45,
  bezierFactor: 0,
  fillType: 1,
  fillColor: '#112233',
  fillAlpha: 0.4,
  texture: null,
  strokeWidth: 4,
  strokeColor: '#445566',
  strokeAlpha: 0.9,
  text: 'Hello',
  fontFamily: 'Arial',
  fontSize: 32,
  textColor: '#ffeeaa',
  textAlpha: 0.7,
  hidden: true,
  locked: true,
  interface: true
};

const SOURCE_14: FoundryDrawingSource = { ...SOURCE_13, name: 'Box', levels: [], fontFamily: '' };

function documentOf(source: FoundryDrawingSource): FoundryDrawingDocument & { update: jest.Mock } {
  const document: FoundryDrawingDocument & { update: jest.Mock } = {
    id: source._id,
    _source: structuredClone(source),
    update: jest.fn((data: Record<string, unknown>) => {
      Object.assign(document._source, data);
      return Promise.resolve(document);
    })
  };
  return document;
}

function setup(
  generation: number,
  documents: FoundryDrawingDocument[] = [],
  created: FoundryDrawingDocument[] = []
): { store: FoundryDrawingStore; create: jest.Mock; remove: jest.Mock } {
  const create = jest.fn().mockResolvedValue(created);
  const remove = jest.fn().mockResolvedValue([]);
  const scene: FoundryDrawingScene = {
    id: 'dungeon',
    drawings: { get: (id) => documents.find((doc) => doc.id === id), contents: documents },
    createEmbeddedDocuments: create,
    deleteEmbeddedDocuments: remove
  };
  const game = {
    scenes: { get: (id: string) => (id === scene.id ? scene : undefined), active: scene },
    users: { get: (id: string) => (id === 'gmgmgmgmgmgmgmgm' ? { id } : undefined) },
    release: { generation }
  };
  (globalThis as Record<string, unknown>)['game'] = game;
  return { store: new FoundryDrawingStore({ getGame: () => game as FoundryDrawingGame }), create, remove };
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>)['game'];
});

describe('FoundryDrawingStore', () => {
  it('reports capabilities by generation and knows the users', () => {
    expect(setup(11).store.capabilities()).toEqual({ supported: false, names: false, levels: false });
    expect(setup(13).store.capabilities()).toEqual({ supported: true, names: false, levels: false });
    expect(setup(14).store.capabilities()).toEqual({ supported: true, names: true, levels: true });
    expect(setup(13).store.exists('gmgmgmgmgmgmgmgm')).toBe(true);
    expect(setup(13).store.exists('nobodynobody0000')).toBe(false);
  });

  describe('reading', () => {
    it('maps a Foundry 13 drawing into fill, stroke and text groups', () => {
      expect(setup(13, [documentOf(SOURCE_13)]).store.findDrawing('dungeon', 'box')).toEqual({
        id: 'box',
        authorId: 'bbbbbbbbbbbbbbbb',
        x: 10,
        y: 20,
        shape: { type: 'rectangle', width: 200, height: 100, points: [] },
        elevation: 2,
        sort: 3,
        rotation: 45,
        bezierFactor: 0,
        fill: { type: 'solid', color: '#112233', alpha: 0.4, texture: null },
        stroke: { width: 4, color: '#445566', alpha: 0.9 },
        text: { content: 'Hello', fontFamily: 'Arial', fontSize: 32, color: '#ffeeaa', alpha: 0.7 },
        hidden: true,
        locked: true,
        interface: true
      });
    });

    it('adds name and levels on Foundry 14 and reads its empty font as the default font', () => {
      expect(setup(14, [documentOf(SOURCE_14)]).store.findDrawing('dungeon', 'box')).toMatchObject({
        name: 'Box',
        levels: [],
        text: { fontFamily: null }
      });
    });

    it('reads absent text, polygon sizes left null by other tools and a circle the canvas does not draw', () => {
      const polygon = documentOf({ _id: 'p', shape: { type: 'p', width: null, height: null, points: [0, 0, 50, 50] } });
      const circle = documentOf({ _id: 'c', shape: { type: 'c', width: null, height: null, points: [] } });
      const { store } = setup(13, [polygon, circle]);

      expect(store.findDrawing('dungeon', 'p')).toMatchObject({
        shape: { type: 'polygon', width: 0, height: 0, points: [0, 0, 50, 50] },
        text: { content: null },
        authorId: null
      });
      expect(store.findDrawing('dungeon', 'c')?.shape.type).toBeNull();
    });

    it('lists the scene drawings and rejects an unknown scene', () => {
      const { store } = setup(13, [documentOf(SOURCE_13)]);

      expect(store.listDrawings('dungeon').map((d) => d.id)).toEqual(['box']);
      expect(store.findDrawing('dungeon', 'nope')).toBeNull();
      expect(() => store.listDrawings('nowhere')).toThrow(SceneNotFoundError);
    });
  });

  describe('writing', () => {
    it('creates with core field names and shape codes, the author only when given', async () => {
      const { store, create } = setup(13, [], [documentOf(SOURCE_13)]);

      await store.createDrawing('dungeon', {
        x: 110,
        y: 200,
        shape: { type: 'polygon', width: 90, height: 40, points: [0, 10, 30, 0, 90, 40] },
        bezierFactor: 0.5,
        fill: { type: 'pattern', texture: 'textures/stone.webp' },
        stroke: { width: 0 },
        text: { content: 'Tavern', fontSize: 64, color: '#ffeeaa' },
        interface: true,
        authorId: undefined
      });

      expect(create).toHaveBeenCalledWith('Drawing', [
        {
          x: 110,
          y: 200,
          bezierFactor: 0.5,
          interface: true,
          shape: { type: 'p', width: 90, height: 40, points: [0, 10, 30, 0, 90, 40] },
          fillType: 2,
          texture: 'textures/stone.webp',
          strokeWidth: 0,
          text: 'Tavern',
          fontSize: 64,
          textColor: '#ffeeaa'
        }
      ]);
    });

    it('writes the author, name and levels when given', async () => {
      const { store, create } = setup(14, [], [documentOf(SOURCE_14)]);

      const created = await store.createDrawing('dungeon', {
        x: 0,
        y: 0,
        shape: { type: 'ellipse', width: 20, height: 20, points: [] },
        authorId: 'gmgmgmgmgmgmgmgm',
        name: 'Ring',
        levels: ['aaaaaaaaaaaaaaaa']
      });

      expect(create.mock.calls[0]?.[1]).toEqual([
        {
          author: 'gmgmgmgmgmgmgmgm',
          name: 'Ring',
          x: 0,
          y: 0,
          levels: ['aaaaaaaaaaaaaaaa'],
          shape: { type: 'e', width: 20, height: 20, points: [] }
        }
      ]);
      expect(created?.id).toBe('box');
    });

    it('clears the text with an empty string and the font, pattern image and name with null', async () => {
      const document = documentOf(SOURCE_14);
      const { store } = setup(14, [document]);

      await store.updateDrawing('dungeon', 'box', {
        text: { content: null, fontFamily: null },
        fill: { texture: null },
        name: null
      });

      expect(document.update).toHaveBeenCalledWith({ name: null, texture: null, text: '', fontFamily: null });
    });

    it('answers null for a missing drawing or an empty create, and deletes through the scene', async () => {
      const { store, remove } = setup(13, [documentOf(SOURCE_13)]);

      await expect(store.updateDrawing('dungeon', 'nope', { x: 1 })).resolves.toBeNull();
      await expect(
        store.createDrawing('dungeon', { x: 0, y: 0, shape: { type: 'rectangle', width: 9, height: 9 } })
      ).resolves.toBeNull();
      await store.deleteDrawing('dungeon', 'box');
      expect(remove).toHaveBeenCalledWith('Drawing', ['box']);
    });
  });
});
