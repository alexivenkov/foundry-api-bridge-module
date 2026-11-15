import type {
  FoundryTemplateDocument,
  FoundryTemplateGame,
  FoundryTemplateSource
} from '../../../../core/templates/infrastructure';
import { createCreateTemplateHandler } from '../CreateTemplateHandler';
import { createDeleteTemplateHandler } from '../DeleteTemplateHandler';
import { createGetTemplatesHandler } from '../GetTemplatesHandler';
import { createUpdateTemplateHandler } from '../UpdateTemplateHandler';

const FIREBALL: FoundryTemplateSource = {
  _id: 'fireball',
  author: 'gmgmgmgmgmgmgmgm',
  t: 'circle',
  x: 500,
  y: 500,
  elevation: 0,
  sort: 1,
  distance: 20,
  direction: 0,
  angle: 0,
  width: 0,
  borderColor: '#000000',
  fillColor: '#ff6400',
  texture: null,
  hidden: false
};

function world(generation = 13): {
  gameProvider: { getGame: () => FoundryTemplateGame };
  document: FoundryTemplateDocument;
  create: jest.Mock;
  remove: jest.Mock;
} {
  const document: FoundryTemplateDocument = {
    id: 'fireball',
    _source: structuredClone(FIREBALL),
    update: jest.fn((data: Record<string, unknown>) => {
      Object.assign(document._source, data);
      return Promise.resolve(document);
    })
  };
  const create = jest.fn((_type: string, data: Record<string, unknown>[]) =>
    Promise.resolve([{ ...document, id: 'new', _source: { ...FIREBALL, ...data[0], _id: 'new' } }])
  );
  const remove = jest.fn().mockResolvedValue([]);
  const scene = {
    id: 'dungeon',
    grid: { distance: 5 },
    templates: { get: (id: string) => (id === 'fireball' ? document : undefined), contents: [document] },
    createEmbeddedDocuments: create,
    deleteEmbeddedDocuments: remove
  };
  const game = {
    scenes: { get: (id: string) => (id === 'dungeon' ? scene : undefined), active: scene },
    users: { get: (id: string) => (id === 'gmgmgmgmgmgmgmgm' ? { id } : undefined) },
    release: { generation }
  };
  (globalThis as Record<string, unknown>)['game'] = game;
  return { gameProvider: { getGame: () => game as unknown as FoundryTemplateGame }, document, create, remove };
}

const config = (): { MeasuredTemplate: { defaults: { angle: number; width: number } } } => ({
  MeasuredTemplate: { defaults: { angle: 53.13, width: 1 } }
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>)['game'];
});

describe('measured template handlers', () => {
  it('get-templates lists the active scene', async () => {
    const { gameProvider } = world();

    await expect(createGetTemplatesHandler({ gameProvider })({})).resolves.toEqual({
      sceneId: 'dungeon',
      templates: [
        {
          id: 'fireball',
          authorId: 'gmgmgmgmgmgmgmgm',
          type: 'circle',
          x: 500,
          y: 500,
          elevation: 0,
          sort: 1,
          distance: 20,
          direction: 0,
          angle: 0,
          width: 0,
          borderColor: '#000000',
          fillColor: '#ff6400',
          texture: null,
          hidden: false
        }
      ]
    });
  });

  it('create-template creates a cone with the tool default angle', async () => {
    const { gameProvider, create } = world();

    const result = await createCreateTemplateHandler({ gameProvider, config })({
      type: 'cone',
      x: 100,
      y: 100,
      distance: 15,
      direction: 270
    });

    expect(create).toHaveBeenCalledWith('MeasuredTemplate', [
      { t: 'cone', x: 100, y: 100, distance: 15, direction: 270, angle: 53.13 }
    ]);
    expect(result).toMatchObject({ id: 'new', sceneId: 'dungeon', type: 'cone', angle: 53.13 });
  });

  it('create-template rejects invalid params before touching Foundry', async () => {
    const { gameProvider, create } = world();

    await expect(createCreateTemplateHandler({ gameProvider })({ type: 'cone', x: 0, y: 0, distance: -5 })).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it('update-template updates and rejects an unknown template', async () => {
    const { gameProvider, document } = world();
    const handler = createUpdateTemplateHandler({ gameProvider, config });

    const result = await handler({ templateId: 'fireball', distance: 40, hidden: true });

    expect(document.update).toHaveBeenCalledWith({ distance: 40, hidden: true });
    expect(result).toMatchObject({ id: 'fireball', distance: 40, hidden: true, sceneId: 'dungeon' });
    await expect(handler({ templateId: 'nope', distance: 1 })).rejects.toThrow('Template not found: nope');
  });

  it('delete-template deletes and reports the ids', async () => {
    const { gameProvider, remove } = world();

    await expect(createDeleteTemplateHandler({ gameProvider })({ templateId: 'fireball' })).resolves.toEqual({
      deleted: true,
      templateId: 'fireball',
      sceneId: 'dungeon'
    });
    expect(remove).toHaveBeenCalledWith('MeasuredTemplate', ['fireball']);
  });

  it('refuses on Foundry 14 and points to regions', async () => {
    const { gameProvider, create } = world(14);

    await expect(createGetTemplatesHandler({ gameProvider })({})).rejects.toThrow(
      'Measured templates are not available in Foundry 14 or newer; use regions'
    );
    await expect(
      createCreateTemplateHandler({ gameProvider })({ type: 'circle', x: 0, y: 0, distance: 5 })
    ).rejects.toThrow('Measured templates are not available in Foundry 14 or newer; use regions');
    expect(create).not.toHaveBeenCalled();
  });
});
