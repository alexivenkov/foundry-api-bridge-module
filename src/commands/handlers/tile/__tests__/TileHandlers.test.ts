import type { FoundryTileDocument, FoundryTileGame, FoundryTileSource } from '../../../../core/tiles/infrastructure';
import { createCreateTileHandler } from '../CreateTileHandler';
import { createDeleteTileHandler } from '../DeleteTileHandler';
import { createGetTilesHandler } from '../GetTilesHandler';
import { createUpdateTileHandler } from '../UpdateTileHandler';

const SOURCE: FoundryTileSource = {
  _id: 'roof',
  width: 300,
  height: 150,
  x: 100,
  y: 200,
  elevation: 20,
  sort: 5,
  rotation: 0,
  alpha: 1,
  hidden: false,
  locked: false,
  texture: {
    src: 'tiles/roof.webp',
    tint: '#ffffff',
    scaleX: 1,
    scaleY: 1,
    anchorX: 0.5,
    anchorY: 0.5,
    fit: 'fill',
    alphaThreshold: 0.75,
    offsetX: 0,
    offsetY: 0,
    rotation: 0
  },
  restrictions: { light: true, weather: true },
  occlusion: { mode: 1, alpha: 0 },
  video: { loop: true, autoplay: true, volume: 0 }
};

function world(generation = 13): {
  gameProvider: { getGame: () => FoundryTileGame };
  document: FoundryTileDocument;
  create: jest.Mock;
  remove: jest.Mock;
} {
  const document: FoundryTileDocument = {
    id: 'roof',
    _source: structuredClone(SOURCE),
    update: jest.fn((data: Record<string, unknown>) => {
      Object.assign(document._source, data);
      return Promise.resolve(document);
    })
  };
  const create = jest.fn((_type: string, data: Record<string, unknown>[]) =>
    Promise.resolve([{ ...document, id: 'new', _source: { ...SOURCE, ...data[0], _id: 'new' } }])
  );
  const remove = jest.fn().mockResolvedValue([]);
  const scene = {
    id: 'dungeon',
    tiles: { get: (id: string) => (id === 'roof' ? document : undefined), contents: [document] },
    createEmbeddedDocuments: create,
    deleteEmbeddedDocuments: remove
  };
  const game = {
    scenes: { get: (id: string) => (id === 'dungeon' ? scene : undefined), active: scene },
    release: { generation }
  };
  (globalThis as Record<string, unknown>)['game'] = game;
  return { gameProvider: { getGame: () => game as unknown as FoundryTileGame }, document, create, remove };
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>)['game'];
});

describe('tile handlers', () => {
  it('get-tiles lists the active scene with wire-shaped tiles', async () => {
    const { gameProvider } = world();

    const result = await createGetTilesHandler({ gameProvider })({});

    expect(result.sceneId).toBe('dungeon');
    expect(result.tiles).toEqual([
      expect.objectContaining({
        id: 'roof',
        elevation: 20,
        restrictions: { light: true, weather: true },
        occlusion: { modes: ['fade'], alpha: 0 },
        texture: expect.objectContaining({ src: 'tiles/roof.webp', offsetX: 0 })
      })
    ]);
    expect(result.tiles[0]).not.toHaveProperty('name');
  });

  it('get-tiles rejects an unknown scene with an Error', async () => {
    const { gameProvider } = world();

    await expect(createGetTilesHandler({ gameProvider })({ sceneId: 'nowhere' })).rejects.toThrow(
      'Scene not found: nowhere'
    );
  });

  it('create-tile creates the tile and answers its snapshot with the scene id', async () => {
    const { gameProvider, create } = world();

    const result = await createCreateTileHandler({ gameProvider })({
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      texture: { src: 'tiles/fire.webm' },
      video: { volume: 0.5 }
    });

    expect(create).toHaveBeenCalledWith('Tile', [
      { x: 0, y: 0, width: 200, height: 100, texture: { src: 'tiles/fire.webm' }, video: { volume: 0.5 } }
    ]);
    expect(result).toMatchObject({ id: 'new', sceneId: 'dungeon', width: 200, video: { volume: 0.5 } });
  });

  it('create-tile rejects invalid params before touching Foundry', async () => {
    const { gameProvider, create } = world();

    await expect(createCreateTileHandler({ gameProvider })({ x: 0, y: 0, width: 0, height: 10 })).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it('create-tile refuses a Foundry 14 feature on Foundry 13', async () => {
    const { gameProvider } = world(13);

    await expect(
      createCreateTileHandler({ gameProvider })({ x: 0, y: 0, width: 10, height: 10, name: 'Roof' })
    ).rejects.toThrow('Tile names require Foundry 14 or newer');
  });

  it('update-tile updates an existing tile and rejects an unknown one', async () => {
    const { gameProvider, document } = world();
    const handler = createUpdateTileHandler({ gameProvider });

    const result = await handler({ tileId: 'roof', elevation: 40 });

    expect(document.update).toHaveBeenCalledWith({ elevation: 40 });
    expect(result).toMatchObject({ id: 'roof', elevation: 40, sceneId: 'dungeon' });
    await expect(handler({ tileId: 'nope', elevation: 1 })).rejects.toThrow('Tile not found: nope');
  });

  it('delete-tile deletes and reports the ids', async () => {
    const { gameProvider, remove } = world();

    await expect(createDeleteTileHandler({ gameProvider })({ tileId: 'roof' })).resolves.toEqual({
      deleted: true,
      tileId: 'roof',
      sceneId: 'dungeon'
    });
    expect(remove).toHaveBeenCalledWith('Tile', ['roof']);
  });

  it('refuses every tile command on Foundry 11', async () => {
    const { gameProvider } = world(11);

    await expect(createGetTilesHandler({ gameProvider })({})).rejects.toThrow(
      'Tile commands require Foundry 12 or newer'
    );
  });
});
