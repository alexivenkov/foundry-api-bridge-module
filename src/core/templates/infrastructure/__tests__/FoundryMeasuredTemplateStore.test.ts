import { SceneNotFoundError } from '../../../shared';
import { FoundryMeasuredTemplateStore } from '../FoundryMeasuredTemplateStore';
import type {
  FoundryTemplateConfig,
  FoundryTemplateDocument,
  FoundryTemplateGame,
  FoundryTemplateScene,
  FoundryTemplateSource
} from '../foundryTemplateTypes';

// Source as Foundry 13.351 stores it (probe of BaseMeasuredTemplate#toObject).
const CONE: FoundryTemplateSource = {
  _id: 'breath',
  author: 'bbbbbbbbbbbbbbbb',
  t: 'cone',
  x: 100,
  y: 200,
  elevation: 5,
  sort: 2,
  distance: 30,
  direction: 90,
  angle: 53.13,
  width: 0,
  borderColor: '#112233',
  fillColor: '#ff0000',
  texture: 'a/b.webm',
  hidden: true
};

function documentOf(source: FoundryTemplateSource): FoundryTemplateDocument & { update: jest.Mock } {
  const document: FoundryTemplateDocument & { update: jest.Mock } = {
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
  options: {
    generation?: number;
    documents?: FoundryTemplateDocument[];
    created?: FoundryTemplateDocument[];
    gridDistance?: number;
    config?: FoundryTemplateConfig;
  } = {}
): { store: FoundryMeasuredTemplateStore; create: jest.Mock; remove: jest.Mock } {
  const documents = options.documents ?? [];
  const create = jest.fn().mockResolvedValue(options.created ?? []);
  const remove = jest.fn().mockResolvedValue([]);
  const scene: FoundryTemplateScene = {
    id: 'dungeon',
    templates: { get: (id) => documents.find((doc) => doc.id === id), contents: documents },
    grid: options.gridDistance !== undefined ? { distance: options.gridDistance } : null,
    createEmbeddedDocuments: create,
    deleteEmbeddedDocuments: remove
  };
  const game = {
    scenes: { get: (id: string) => (id === scene.id ? scene : undefined), active: scene },
    users: { get: (id: string) => (id === 'gmgmgmgmgmgmgmgm' ? { id } : undefined) },
    release: { generation: options.generation ?? 13 }
  };
  (globalThis as Record<string, unknown>)['game'] = game;
  const store = new FoundryMeasuredTemplateStore(
    { getGame: () => game as FoundryTemplateGame },
    () => options.config
  );
  return { store, create, remove };
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>)['game'];
});

describe('FoundryMeasuredTemplateStore', () => {
  it('reports Foundry 12–13 as supported and Foundry 14 as merged into regions', () => {
    expect(setup({ generation: 11 }).store.capabilities()).toEqual({ supported: false, mergedIntoRegions: false });
    expect(setup({ generation: 13 }).store.capabilities()).toEqual({ supported: true, mergedIntoRegions: false });
    expect(setup({ generation: 14 }).store.capabilities()).toEqual({ supported: true, mergedIntoRegions: true });
  });

  it('reads the tool defaults from CONFIG and the scene grid, with the core values as fallback', () => {
    expect(
      setup({ gridDistance: 1.5, config: { MeasuredTemplate: { defaults: { angle: 90, width: 2 } } } }).store.toolDefaults(
        'dungeon'
      )
    ).toEqual({ coneAngle: 90, rayWidth: 3 });
    expect(setup().store.toolDefaults('dungeon')).toEqual({ coneAngle: 53.13, rayWidth: 5 });
  });

  it('knows the users', () => {
    expect(setup().store.exists('gmgmgmgmgmgmgmgm')).toBe(true);
    expect(setup().store.exists('nobodynobody0000')).toBe(false);
  });

  it('maps a stored template, reading the rect code as rectangle', () => {
    const rect = documentOf({ ...CONE, _id: 'wall', t: 'rect', texture: null, author: null });
    const { store } = setup({ documents: [documentOf(CONE), rect] });

    expect(store.findTemplate('dungeon', 'breath')).toEqual({
      id: 'breath',
      authorId: 'bbbbbbbbbbbbbbbb',
      type: 'cone',
      x: 100,
      y: 200,
      elevation: 5,
      sort: 2,
      distance: 30,
      direction: 90,
      angle: 53.13,
      width: 0,
      borderColor: '#112233',
      fillColor: '#ff0000',
      texture: 'a/b.webm',
      hidden: true
    });
    expect(store.findTemplate('dungeon', 'wall')).toMatchObject({ type: 'rectangle', texture: null, authorId: null });
    expect(store.listTemplates('dungeon').map((t) => t.id)).toEqual(['breath', 'wall']);
    expect(store.findTemplate('dungeon', 'nope')).toBeNull();
  });

  it('rejects an unknown scene', () => {
    expect(() => setup().store.listTemplates('nowhere')).toThrow(SceneNotFoundError);
  });

  it('creates with the core field names: t, author', async () => {
    const { store, create } = setup({ created: [documentOf(CONE)] });

    const created = await store.createTemplate('dungeon', {
      type: 'rectangle',
      x: 0,
      y: 0,
      distance: 28.28,
      direction: 45,
      authorId: 'gmgmgmgmgmgmgmgm',
      hidden: true
    });

    expect(create).toHaveBeenCalledWith('MeasuredTemplate', [
      { author: 'gmgmgmgmgmgmgmgm', t: 'rect', x: 0, y: 0, distance: 28.28, direction: 45, hidden: true }
    ]);
    expect(created?.id).toBe('breath');
  });

  it('leaves the author to the core when none is given and answers null for an empty create', async () => {
    const { store, create } = setup();

    await expect(store.createTemplate('dungeon', { type: 'circle', x: 1, y: 2, distance: 5 })).resolves.toBeNull();
    expect(create).toHaveBeenCalledWith('MeasuredTemplate', [{ t: 'circle', x: 1, y: 2, distance: 5 }]);
  });

  it('updates only the changed fields and clears the texture with null', async () => {
    const document = documentOf(CONE);
    const { store } = setup({ documents: [document] });

    const updated = await store.updateTemplate('dungeon', 'breath', { fillColor: '#abcdef', texture: null, type: 'ray' });

    expect(document.update).toHaveBeenCalledWith({ t: 'ray', fillColor: '#abcdef', texture: null });
    expect(updated).toMatchObject({ type: 'ray', fillColor: '#abcdef', texture: null });
    await expect(store.updateTemplate('dungeon', 'nope', { x: 1 })).resolves.toBeNull();
  });

  it('deletes through the scene', async () => {
    const { store, remove } = setup({ documents: [documentOf(CONE)] });

    await store.deleteTemplate('dungeon', 'breath');

    expect(remove).toHaveBeenCalledWith('MeasuredTemplate', ['breath']);
  });
});
