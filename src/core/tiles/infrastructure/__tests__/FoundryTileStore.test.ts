import { SceneNotFoundError } from '../../../shared';
import { FoundryTileStore } from '../FoundryTileStore';
import type { FoundryTileDocument, FoundryTileGame, FoundryTileScene, FoundryTileSource } from '../foundryTileTypes';

// Sources as the installed cores store them (probe of BaseTile#toObject).
const SOURCE_13: FoundryTileSource = {
  _id: 'roof',
  width: 300,
  height: 150,
  x: 100,
  y: 200,
  elevation: 20,
  sort: 5,
  rotation: 30,
  alpha: 0.8,
  hidden: true,
  locked: true,
  texture: {
    src: 'tiles/roof.webp',
    tint: '#ff8800',
    scaleX: 1.5,
    scaleY: -1,
    anchorX: 0.5,
    anchorY: 0.5,
    fit: 'contain',
    alphaThreshold: 0.5,
    offsetX: 10,
    offsetY: 20,
    rotation: 45
  },
  restrictions: { light: true, weather: false },
  occlusion: { mode: 4, alpha: 0.25 },
  video: { loop: false, autoplay: true, volume: 0.3 }
};

const SOURCE_14: FoundryTileSource = {
  _id: 'roof',
  name: 'Roof',
  width: 300,
  height: 150,
  x: 100,
  y: 200,
  elevation: 20,
  levels: ['aaaaaaaaaaaaaaaa'],
  sort: 5,
  rotation: 30,
  alpha: 0.8,
  hidden: true,
  locked: true,
  texture: {
    src: 'tiles/roof.webp',
    tint: '#ff8800',
    scaleX: 1.5,
    scaleY: -1,
    anchorX: 0.5,
    anchorY: 0.5,
    fit: 'contain',
    alphaThreshold: 0.5
  },
  restrictions: { light: true, weather: false },
  occlusion: { modes: [1, 8], alpha: 0.25 },
  video: { loop: false, autoplay: true, volume: 0.3 }
};

function documentOf(source: FoundryTileSource): FoundryTileDocument & { update: jest.Mock } {
  const document: FoundryTileDocument & { update: jest.Mock } = {
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
  documents: FoundryTileDocument[] = [],
  created: FoundryTileDocument[] = []
): { store: FoundryTileStore; scene: FoundryTileScene; create: jest.Mock; remove: jest.Mock } {
  const create = jest.fn().mockResolvedValue(created);
  const remove = jest.fn().mockResolvedValue([]);
  const scene: FoundryTileScene = {
    id: 'dungeon',
    tiles: { get: (id) => documents.find((doc) => doc.id === id), contents: documents },
    createEmbeddedDocuments: create,
    deleteEmbeddedDocuments: remove
  };
  const game = {
    scenes: { get: (id: string) => (id === scene.id ? scene : undefined), active: scene },
    release: { generation }
  };
  (globalThis as Record<string, unknown>)['game'] = game;
  return { store: new FoundryTileStore({ getGame: () => game as FoundryTileGame }), scene, create, remove };
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>)['game'];
});

describe('FoundryTileStore', () => {
  describe('capabilities', () => {
    it('follows the generation', () => {
      expect(setup(11).store.capabilities().supported).toBe(false);
      expect(setup(12).store.capabilities()).toEqual({
        supported: true,
        names: false,
        levels: false,
        textureOffset: true,
        occlusionModeSet: false
      });
      expect(setup(14).store.capabilities()).toEqual({
        supported: true,
        names: true,
        levels: true,
        textureOffset: false,
        occlusionModeSet: true
      });
    });
  });

  describe('reading', () => {
    it('maps a Foundry 13 tile with the texture offset and its single occlusion mode', () => {
      const { store } = setup(13, [documentOf(SOURCE_13)]);

      expect(store.findTile('dungeon', 'roof')).toEqual({
        id: 'roof',
        x: 100,
        y: 200,
        width: 300,
        height: 150,
        elevation: 20,
        sort: 5,
        rotation: 30,
        alpha: 0.8,
        hidden: true,
        locked: true,
        texture: {
          src: 'tiles/roof.webp',
          tint: '#ff8800',
          scaleX: 1.5,
          scaleY: -1,
          anchorX: 0.5,
          anchorY: 0.5,
          fit: 'contain',
          alphaThreshold: 0.5,
          offsetX: 10,
          offsetY: 20,
          rotation: 45
        },
        restrictions: { light: true, weather: false },
        occlusion: { modes: ['vision'], alpha: 0.25 },
        video: { loop: false, autoplay: true, volume: 0.3 }
      });
    });

    it('maps a Foundry 14 tile with name, levels and its set of occlusion flags, without texture offset', () => {
      const tile = setup(14, [documentOf(SOURCE_14)]).store.findTile('dungeon', 'roof');

      expect(tile).toMatchObject({ name: 'Roof', levels: ['aaaaaaaaaaaaaaaa'], occlusion: { modes: ['fade', 'vision'] } });
      expect(tile?.texture).not.toHaveProperty('offsetX');
      expect(tile?.texture).not.toHaveProperty('rotation');
    });

    it('reads the core defaults of a bare tile: no image, no occlusion, no name', () => {
      const bare14: FoundryTileSource = {
        _id: 'bare',
        width: 100,
        height: 100,
        texture: { src: null, tint: '#ffffff' },
        occlusion: { modes: [], alpha: 0 }
      };
      const bare13: FoundryTileSource = { ...bare14, occlusion: { mode: 0, alpha: 0 } };

      expect(setup(14, [documentOf(bare14)]).store.findTile('dungeon', 'bare')).toMatchObject({
        name: null,
        levels: [],
        texture: { src: null, fit: 'fill' },
        occlusion: { modes: [] }
      });
      expect(setup(13, [documentOf(bare13)]).store.findTile('dungeon', 'bare')?.occlusion.modes).toEqual([]);
    });

    it('lists the scene tiles and answers null for an unknown one', () => {
      const { store } = setup(13, [documentOf(SOURCE_13), documentOf({ ...SOURCE_13, _id: 'floor' })]);

      expect(store.listTiles('dungeon').map((t) => t.id)).toEqual(['roof', 'floor']);
      expect(store.findTile('dungeon', 'nope')).toBeNull();
    });

    it('rejects an unknown scene', () => {
      expect(() => setup(13).store.listTiles('nowhere')).toThrow(SceneNotFoundError);
    });
  });

  describe('creating', () => {
    const draft = {
      x: 100,
      y: 200,
      width: 300,
      height: 150,
      elevation: 20,
      texture: { src: 'tiles/roof.webp', tint: '#ff8800', offsetX: 10 },
      restrictions: { light: true },
      occlusion: { modes: ['vision' as const], alpha: 0.25 },
      video: { loop: false }
    };

    it('writes the single occlusion code on Foundry 13', async () => {
      const { store, create } = setup(13, [], [documentOf(SOURCE_13)]);

      const created = await store.createTile('dungeon', draft);

      expect(create).toHaveBeenCalledWith('Tile', [
        {
          x: 100,
          y: 200,
          width: 300,
          height: 150,
          elevation: 20,
          texture: { src: 'tiles/roof.webp', tint: '#ff8800', offsetX: 10 },
          restrictions: { light: true },
          occlusion: { mode: 4, alpha: 0.25 },
          video: { loop: false }
        }
      ]);
      expect(created?.id).toBe('roof');
    });

    it('writes the occlusion flags, the name and the levels on Foundry 14', async () => {
      const { store, create } = setup(14, [], [documentOf(SOURCE_14)]);

      await store.createTile('dungeon', {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        name: 'Roof',
        levels: ['aaaaaaaaaaaaaaaa'],
        occlusion: { modes: ['fade', 'surface', 'radial', 'vision'] }
      });

      expect(create).toHaveBeenCalledWith('Tile', [
        { x: 0, y: 0, width: 10, height: 10, name: 'Roof', levels: ['aaaaaaaaaaaaaaaa'], occlusion: { modes: [1, 2, 4, 8] } }
      ]);
    });

    it('writes no occlusion mode as code 0 on Foundry 13 and as an empty set on Foundry 14', async () => {
      const thirteen = setup(13, [], [documentOf(SOURCE_13)]);
      await thirteen.store.createTile('dungeon', { x: 0, y: 0, width: 10, height: 10, occlusion: { modes: [] } });
      expect(thirteen.create.mock.calls[0]?.[1]).toEqual([
        { x: 0, y: 0, width: 10, height: 10, occlusion: { mode: 0 } }
      ]);

      const fourteen = setup(14, [], [documentOf(SOURCE_14)]);
      await fourteen.store.createTile('dungeon', { x: 0, y: 0, width: 10, height: 10, occlusion: { modes: [] } });
      expect(fourteen.create.mock.calls[0]?.[1]).toEqual([
        { x: 0, y: 0, width: 10, height: 10, occlusion: { modes: [] } }
      ]);
    });

    it('answers null when the core created nothing', async () => {
      await expect(setup(13).store.createTile('dungeon', { x: 0, y: 0, width: 1, height: 1 })).resolves.toBeNull();
    });
  });

  describe('updating', () => {
    it('sends only the changed fields, nested groups partial, and reads the result back', async () => {
      const document = documentOf(SOURCE_13);
      const { store } = setup(13, [document]);

      const updated = await store.updateTile('dungeon', 'roof', {
        alpha: 0.5,
        texture: { tint: '#00ff00' },
        occlusion: { alpha: 0.9 },
        video: { volume: 1 }
      });

      expect(document.update).toHaveBeenCalledWith({
        alpha: 0.5,
        texture: { tint: '#00ff00' },
        occlusion: { alpha: 0.9 },
        video: { volume: 1 }
      });
      expect(updated?.alpha).toBe(0.5);
    });

    it('clears the image and the name with null', async () => {
      const document = documentOf(SOURCE_14);
      const { store } = setup(14, [document]);

      await store.updateTile('dungeon', 'roof', { name: null, texture: { src: null } });

      expect(document.update).toHaveBeenCalledWith({ name: null, texture: { src: null } });
    });

    it('answers null for a tile that is gone', async () => {
      await expect(setup(13).store.updateTile('dungeon', 'nope', { x: 1 })).resolves.toBeNull();
    });
  });

  it('deletes through the scene', async () => {
    const { store, remove } = setup(13, [documentOf(SOURCE_13)]);

    await store.deleteTile('dungeon', 'roof');

    expect(remove).toHaveBeenCalledWith('Tile', ['roof']);
  });
});
