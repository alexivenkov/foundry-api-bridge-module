import type {
  FoundryDrawingDocument,
  FoundryDrawingGame,
  FoundryDrawingSource
} from '../../../../core/drawings/infrastructure';
import { createCreateDrawingHandler } from '../CreateDrawingHandler';
import { createDeleteDrawingHandler } from '../DeleteDrawingHandler';
import { createGetDrawingsHandler } from '../GetDrawingsHandler';
import { createUpdateDrawingHandler } from '../UpdateDrawingHandler';

const LABEL: FoundryDrawingSource = {
  _id: 'label',
  author: 'gmgmgmgmgmgmgmgm',
  shape: { type: 'r', width: 400, height: 80, points: [] },
  x: 0,
  y: 0,
  elevation: 0,
  sort: 0,
  rotation: 0,
  bezierFactor: 0,
  fillType: 0,
  fillColor: '#aa33cc',
  fillAlpha: 0.5,
  texture: null,
  strokeWidth: 0,
  strokeColor: '#aa33cc',
  strokeAlpha: 1,
  text: 'Tavern',
  fontFamily: 'Signika',
  fontSize: 48,
  textColor: '#ffffff',
  textAlpha: 1,
  hidden: false,
  locked: false,
  interface: false
};

function world(generation = 13): {
  gameProvider: { getGame: () => FoundryDrawingGame };
  document: FoundryDrawingDocument;
  create: jest.Mock;
  remove: jest.Mock;
} {
  const document: FoundryDrawingDocument = {
    id: 'label',
    _source: structuredClone(LABEL),
    update: jest.fn((data: Record<string, unknown>) => {
      Object.assign(document._source, data);
      return Promise.resolve(document);
    })
  };
  const create = jest.fn((_type: string, data: Record<string, unknown>[]) =>
    Promise.resolve([{ ...document, id: 'new', _source: { ...LABEL, ...data[0], _id: 'new' } }])
  );
  const remove = jest.fn().mockResolvedValue([]);
  const scene = {
    id: 'dungeon',
    drawings: { get: (id: string) => (id === 'label' ? document : undefined), contents: [document] },
    createEmbeddedDocuments: create,
    deleteEmbeddedDocuments: remove
  };
  const game = {
    scenes: { get: (id: string) => (id === 'dungeon' ? scene : undefined), active: scene },
    users: { get: (id: string) => (id === 'gmgmgmgmgmgmgmgm' ? { id } : undefined) },
    release: { generation }
  };
  (globalThis as Record<string, unknown>)['game'] = game;
  return { gameProvider: { getGame: () => game as unknown as FoundryDrawingGame }, document, create, remove };
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>)['game'];
});

describe('drawing handlers', () => {
  it('get-drawings lists the active scene with grouped fill, stroke and text', async () => {
    const { gameProvider } = world();

    const result = await createGetDrawingsHandler({ gameProvider })({ sceneId: null });

    expect(result).toEqual({
      sceneId: 'dungeon',
      drawings: [
        expect.objectContaining({
          id: 'label',
          authorId: 'gmgmgmgmgmgmgmgm',
          shape: { type: 'rectangle', width: 400, height: 80, points: [] },
          stroke: { width: 0, color: '#aa33cc', alpha: 1 },
          text: { content: 'Tavern', fontFamily: 'Signika', fontSize: 48, color: '#ffffff', alpha: 1 }
        })
      ]
    });
  });

  it('create-drawing puts a text label on the map', async () => {
    const { gameProvider, create } = world();

    const result = await createCreateDrawingHandler({ gameProvider })({
      x: 500,
      y: 300,
      shape: { type: 'rectangle', width: 400, height: 80 },
      stroke: { width: 0 },
      text: { content: 'Old Mill', fontSize: 64 }
    });

    expect(create).toHaveBeenCalledWith('Drawing', [
      { x: 500, y: 300, shape: { type: 'r', width: 400, height: 80, points: [] }, strokeWidth: 0, text: 'Old Mill', fontSize: 64 }
    ]);
    expect(result).toMatchObject({ id: 'new', sceneId: 'dungeon', text: { content: 'Old Mill', fontSize: 64 } });
  });

  it('create-drawing rejects an invalid request and an unknown author', async () => {
    const { gameProvider, create } = world();
    const handler = createCreateDrawingHandler({ gameProvider });

    await expect(handler({ x: 0, y: 0, shape: { type: 'polygon', points: [1, 2] } })).rejects.toThrow();
    await expect(
      handler({ x: 0, y: 0, shape: { type: 'rectangle', width: 50, height: 50 }, authorId: 'nobodynobody0000' })
    ).rejects.toThrow('User not found: nobodynobody0000');
    expect(create).not.toHaveBeenCalled();
  });

  it('update-drawing updates and rejects an unknown drawing', async () => {
    const { gameProvider, document } = world();
    const handler = createUpdateDrawingHandler({ gameProvider });

    const result = await handler({ drawingId: 'label', text: { content: 'Inn' }, hidden: true });

    expect(document.update).toHaveBeenCalledWith({ hidden: true, text: 'Inn' });
    expect(result).toMatchObject({ id: 'label', sceneId: 'dungeon', hidden: true, text: { content: 'Inn' } });
    await expect(handler({ drawingId: 'nope', hidden: true })).rejects.toThrow('Drawing not found: nope');
  });

  it('delete-drawing deletes and reports the ids', async () => {
    const { gameProvider, remove } = world();

    await expect(createDeleteDrawingHandler({ gameProvider })({ drawingId: 'label' })).resolves.toEqual({
      deleted: true,
      drawingId: 'label',
      sceneId: 'dungeon'
    });
    expect(remove).toHaveBeenCalledWith('Drawing', ['label']);
  });

  it('refuses the commands on Foundry 11', async () => {
    const { gameProvider } = world(11);

    await expect(createGetDrawingsHandler({ gameProvider })({})).rejects.toThrow(
      'Drawing commands require Foundry 12 or newer'
    );
  });
});
