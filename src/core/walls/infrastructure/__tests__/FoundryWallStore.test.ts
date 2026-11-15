import { SceneNotFoundError } from '../../../shared';
import { FoundryWallStore } from '../FoundryWallStore';
import type { FoundryWallDocument, FoundryWallGame, FoundryWallScene } from '../foundryWallTypes';

function document(overrides: Partial<FoundryWallDocument> = {}): FoundryWallDocument {
  const doc: FoundryWallDocument = {
    _id: 'w1',
    c: [0, 0, 100, 0],
    door: 0,
    ds: 0,
    move: 20,
    sight: 20,
    sound: 20,
    light: 20,
    dir: 0,
    update: jest.fn(),
    ...overrides
  };
  (doc.update as jest.Mock).mockImplementation((data: Partial<FoundryWallDocument>) => {
    Object.assign(doc, data);
    return Promise.resolve(doc);
  });
  return doc;
}

interface SceneMocks {
  scene: FoundryWallScene;
  create: jest.Mock;
  remove: jest.Mock;
}

function scene(id: string, documents: FoundryWallDocument[] = []): SceneMocks {
  const create = jest.fn();
  const remove = jest.fn().mockResolvedValue([]);
  return {
    scene: {
      id,
      walls: { get: (wallId) => documents.find((doc) => doc._id === wallId), contents: documents },
      createEmbeddedDocuments: create,
      deleteEmbeddedDocuments: remove
    },
    create,
    remove
  };
}

function storeFor(...scenes: FoundryWallScene[]): FoundryWallStore {
  const game: FoundryWallGame = {
    scenes: { get: (id) => scenes.find((candidate) => candidate.id === id), active: scenes[0] ?? null }
  };
  return new FoundryWallStore({ getGame: () => game });
}

describe('FoundryWallStore', () => {
  describe('reading', () => {
    it('maps the core codes to the domain vocabulary, vision coming from the sight field', () => {
      const { scene: dungeon } = scene('dungeon', [
        document({ _id: 'a', c: [1, 2, 3, 4], door: 2, ds: 2, move: 0, sight: 10, sound: 0, light: 20, dir: 1 })
      ]);

      expect(storeFor(dungeon).listWalls('dungeon')).toEqual([
        {
          id: 'a',
          segment: [1, 2, 3, 4],
          door: 'secret',
          doorState: 'locked',
          movement: 'none',
          sight: 'limited',
          sound: 'none',
          light: 'normal',
          direction: 'left'
        }
      ]);
    });

    it('falls back to the core defaults for missing fields', () => {
      const sparse = document({ ds: undefined, move: undefined, sight: undefined, sound: undefined, light: undefined, dir: undefined });
      const { scene: dungeon } = scene('dungeon', [sparse]);

      expect(storeFor(dungeon).findWall('dungeon', 'w1')).toMatchObject({
        doorState: 'closed',
        movement: 'normal',
        sight: 'normal',
        sound: 'normal',
        light: 'normal',
        direction: 'both'
      });
    });

    it('reads the threshold-based sense types and unknown codes as normal', () => {
      const { scene: dungeon } = scene('dungeon', [document({ sight: 30, sound: 40, light: 99, door: 99, ds: 99, dir: 99 })]);

      expect(storeFor(dungeon).findWall('dungeon', 'w1')).toMatchObject({
        sight: 'normal',
        sound: 'normal',
        light: 'normal',
        door: 'none',
        doorState: 'closed',
        direction: 'both'
      });
    });

    it('pads a short coordinate array with zeros', () => {
      const { scene: dungeon } = scene('dungeon', [document({ c: [10] })]);

      expect(storeFor(dungeon).findWall('dungeon', 'w1')?.segment).toEqual([10, 0, 0, 0]);
    });

    it('returns null for an unknown wall', () => {
      expect(storeFor(scene('dungeon').scene).findWall('dungeon', 'missing')).toBeNull();
    });

    it('rejects an unknown scene', () => {
      expect(() => storeFor(scene('dungeon').scene).listWalls('missing')).toThrow(SceneNotFoundError);
    });
  });

  describe('createWall', () => {
    it('writes the core field names and codes and returns the created wall', async () => {
      const { scene: dungeon, create } = scene('dungeon');
      create.mockResolvedValue([document({ _id: 'new', c: [5, 5, 50, 50], sight: 10 })]);

      const created = await storeFor(dungeon).createWall('dungeon', {
        segment: [5, 5, 50, 50],
        door: 'door',
        doorState: 'open',
        movement: 'normal',
        sight: 'limited',
        sound: 'none',
        light: 'normal',
        direction: 'right'
      });

      expect(create).toHaveBeenCalledWith('Wall', [
        { c: [5, 5, 50, 50], door: 1, ds: 1, move: 20, sight: 10, sound: 0, light: 20, dir: 2 }
      ]);
      expect(created).toMatchObject({ id: 'new', sight: 'limited' });
    });

    it('sends only the attributes that are set', async () => {
      const { scene: dungeon, create } = scene('dungeon');
      create.mockResolvedValue([document()]);

      await storeFor(dungeon).createWall('dungeon', { segment: [0, 0, 1, 1], door: undefined });

      expect(create).toHaveBeenCalledWith('Wall', [{ c: [0, 0, 1, 1] }]);
    });

    it('resolves to null when the core created nothing', async () => {
      const { scene: dungeon, create } = scene('dungeon');
      create.mockResolvedValue([]);

      await expect(storeFor(dungeon).createWall('dungeon', { segment: [0, 0, 1, 1] })).resolves.toBeNull();
    });
  });

  describe('updateWall', () => {
    it('sends a partial update and returns the wall as it is afterwards', async () => {
      const doc = document({ door: 1, ds: 0 });
      const { scene: dungeon } = scene('dungeon', [doc]);

      const updated = await storeFor(dungeon).updateWall('dungeon', 'w1', { doorState: 'locked' });

      expect(doc.update).toHaveBeenCalledWith({ ds: 2 });
      expect(updated?.doorState).toBe('locked');
    });

    it('resolves to null for an unknown wall', async () => {
      await expect(storeFor(scene('dungeon').scene).updateWall('dungeon', 'missing', {})).resolves.toBeNull();
    });
  });

  describe('deleteWall', () => {
    it('deletes the embedded document by id', async () => {
      const { scene: dungeon, remove } = scene('dungeon', [document()]);

      await storeFor(dungeon).deleteWall('dungeon', 'w1');

      expect(remove).toHaveBeenCalledWith('Wall', ['w1']);
    });
  });

  it('addresses a scene that is not the active one', () => {
    const { scene: tavern } = scene('tavern', [document({ _id: 'bar' })]);

    expect(storeFor(scene('dungeon').scene, tavern).listWalls('tavern').map((w) => w.id)).toEqual(['bar']);
  });
});
