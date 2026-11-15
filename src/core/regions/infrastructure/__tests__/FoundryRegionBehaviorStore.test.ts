import { RegionNotFoundError } from '../../domain';
import { FoundryRegionBehaviorCatalog } from '../FoundryRegionBehaviorCatalog';
import { FoundryRegionBehaviorStore } from '../FoundryRegionBehaviorStore';
import { toFoundrySystem, toRegionBehavior } from '../behaviorMapper';
import { V13_SOURCE, fakeBehavior, fakeRegion, fakeScene, gameWith, globalsWith, type FakeRegion } from './fakeFoundry';

const forcedReplacement = { create: jest.fn((value: unknown) => ({ forced: value })) };

function setup(generation: number, region: FakeRegion = fakeRegion(V13_SOURCE)): { store: FoundryRegionBehaviorStore; region: FakeRegion } {
  const globals = globalsWith({ foundry: { data: { operators: { ForcedReplacement: forcedReplacement } } } });
  return { store: new FoundryRegionBehaviorStore(gameWith(fakeScene('S', [region])), globals, () => generation), region };
}

const pause = (): ReturnType<typeof fakeBehavior> =>
  fakeBehavior({ _id: 'b1', name: 'Halt', type: 'pauseGame', disabled: false, system: { once: false } });

describe('FoundryRegionBehaviorStore', () => {
  beforeEach(() => forcedReplacement.create.mockClear());

  it('creates a behavior with its system data', async () => {
    const { store, region } = setup(13);
    region.createEmbeddedDocuments.mockResolvedValue([pause()]);

    const created = await store.createBehavior('S', 'r1', {
      type: 'pauseGame',
      name: 'Halt',
      disabled: true,
      config: { kind: 'pauseGame', settings: { once: true } }
    });

    expect(region.createEmbeddedDocuments).toHaveBeenCalledWith('RegionBehavior', [
      { type: 'pauseGame', system: { once: true }, name: 'Halt', disabled: true }
    ]);
    expect(created).toEqual({
      id: 'b1',
      name: 'Halt',
      type: 'pauseGame',
      disabled: false,
      config: { kind: 'pauseGame', settings: { once: false } }
    });
  });

  it('writes a teleport as the generation stores it', async () => {
    const config = {
      kind: 'teleportToken' as const,
      settings: { destinationUuids: ['Scene.S.Region.rrrrrrrrrrrrrrr2'], choice: true }
    };
    const v13 = setup(13);
    v13.region.createEmbeddedDocuments.mockResolvedValue([]);
    await expect(v13.store.createBehavior('S', 'r1', { type: 'teleportToken', config })).resolves.toBeNull();
    expect(v13.region.createEmbeddedDocuments).toHaveBeenCalledWith('RegionBehavior', [
      { type: 'teleportToken', system: { destination: 'Scene.S.Region.rrrrrrrrrrrrrrr2', choice: true } }
    ]);

    const v14 = setup(14);
    v14.region.createEmbeddedDocuments.mockResolvedValue([]);
    await v14.store.createBehavior('S', 'r1', { type: 'teleportToken', config });
    expect(v14.region.createEmbeddedDocuments).toHaveBeenCalledWith('RegionBehavior', [
      { type: 'teleportToken', system: { destinations: ['Scene.S.Region.rrrrrrrrrrrrrrr2'], choice: true } }
    ]);
  });

  it('merges a config of the same type', async () => {
    const behavior = pause();
    const { store } = setup(14, fakeRegion(V13_SOURCE, [behavior]));

    const updated = await store.updateBehavior('S', 'r1', 'b1', {
      name: 'Stop',
      config: { kind: 'pauseGame', settings: { once: true } }
    });

    expect(behavior.update).toHaveBeenCalledWith({ name: 'Stop', system: { once: true } });
    expect(updated?.config).toEqual({ kind: 'pauseGame', settings: { once: true } });
  });

  it('force-replaces the system on a type change: ==system before Foundry 14', async () => {
    const behavior = pause();
    const { store } = setup(13, fakeRegion(V13_SOURCE, [behavior]));

    await store.updateBehavior('S', 'r1', 'b1', {
      type: 'displayScrollingText',
      config: { kind: 'displayScrollingText', settings: { text: 'Hi', visibility: 'gamemaster' } }
    });

    expect(behavior.update).toHaveBeenCalledWith({
      type: 'displayScrollingText',
      '==system': { text: 'Hi', visibility: 0 }
    });
    expect(forcedReplacement.create).not.toHaveBeenCalled();
  });

  it('force-replaces the system on a type change: ForcedReplacement on Foundry 14', async () => {
    const behavior = pause();
    const { store } = setup(14, fakeRegion(V13_SOURCE, [behavior]));

    await store.updateBehavior('S', 'r1', 'b1', { type: 'suppressWeather' });

    expect(forcedReplacement.create).toHaveBeenCalledWith({});
    expect(behavior.update).toHaveBeenCalledWith({ type: 'suppressWeather', system: { forced: {} } });
  });

  it('answers null for a missing behavior and refuses a missing region', async () => {
    const { store } = setup(13);
    await expect(store.updateBehavior('S', 'r1', 'zz', { name: 'X' })).resolves.toBeNull();
    await expect(store.deleteBehavior('S', 'zz', 'b1')).rejects.toThrow(new RegionNotFoundError('zz'));
  });

  it('deletes through the region', async () => {
    const { store, region } = setup(13);
    await store.deleteBehavior('S', 'r1', 'b1');
    expect(region.deleteEmbeddedDocuments).toHaveBeenCalledWith('RegionBehavior', ['b1']);
  });
});

describe('behaviorMapper', () => {
  const identity = (uuid: string): string => uuid;

  it('maps the system data of each core type as the probe stored it', () => {
    const read = (type: string, system: Record<string, unknown>): unknown =>
      toRegionBehavior({ _id: 'b', name: '', type, disabled: false, system }, identity).config;

    expect(read('adjustDarknessLevel', { mode: 2, modifier: 0.4 })).toEqual({
      kind: 'adjustDarknessLevel',
      settings: { mode: 'darken', modifier: 0.4 }
    });
    expect(read('displayScrollingText', { events: ['tokenAnimateIn'], text: 'Boo', color: '#00ff00', visibility: 1, once: true })).toEqual({
      kind: 'displayScrollingText',
      settings: { events: ['tokenAnimateIn'], text: 'Boo', color: '#00ff00', visibility: 'observer', once: true }
    });
    expect(read('executeMacro', { events: [], uuid: null, everyone: false })).toEqual({
      kind: 'executeMacro',
      settings: { events: [], macroUuid: null, everyone: false }
    });
    expect(read('modifyMovementCost', { difficulties: { walk: 2, fly: null, swim: 1, burrow: 1 } })).toEqual({
      kind: 'modifyMovementCost',
      settings: { difficulties: { walk: 2, fly: null, swim: 1, burrow: 1 } }
    });
    expect(read('teleportToken', { destination: null, choice: false })).toEqual({
      kind: 'teleportToken',
      settings: { destinationUuids: [], choice: false }
    });
    expect(read('defineSurface', { placement: 'both', light: false, move: true, sight: true, sound: true, occlusion: true, exposure: false, culling: true })).toEqual({
      kind: 'defineSurface',
      settings: { placement: 'both', light: false, move: true, sight: true, sound: true, occlusion: true, exposure: false, culling: true }
    });
    expect(read('mymodule.thing', { anything: [1, 2] })).toEqual({ kind: 'opaque', data: { anything: [1, 2] } });
  });

  it('writes only the fields that are set', () => {
    expect(toFoundrySystem({ kind: 'executeMacro', settings: { macroUuid: 'Macro.aaaaaaaaaaaaaaaa' } }, false)).toEqual({
      uuid: 'Macro.aaaaaaaaaaaaaaaa'
    });
    expect(toFoundrySystem({ kind: 'teleportToken', settings: { destinationUuids: [] } }, false)).toEqual({ destination: null });
    expect(
      toFoundrySystem({ kind: 'teleportToken', settings: { dialog: { unrevealed: 'C' }, transition: { duration: 1000 } } }, true)
    ).toEqual({ dialog: { unrevealed: 'C' }, transition: { duration: 1000 } });
    expect(
      toFoundrySystem({ kind: 'toggleBehavior', settings: { enableUuids: ['x'], disableUuids: [] } }, true)
    ).toEqual({ enable: ['x'], disable: [] });
    expect(toFoundrySystem({ kind: 'applyActiveEffect', settings: { effectUuids: ['e'] } }, true)).toEqual({ effects: ['e'] });
    expect(toFoundrySystem({ kind: 'adjustDarknessLevel', settings: { mode: 'brighten' } }, true)).toEqual({ mode: 1 });
    expect(toFoundrySystem({ kind: 'opaque', data: { a: 1 } }, true)).toEqual({ a: 1 });
  });
});

describe('FoundryRegionBehaviorCatalog', () => {
  it('reads types, events and movement actions from the world', () => {
    const catalog = new FoundryRegionBehaviorCatalog(
      () => ({
        game: { documentTypes: { RegionBehavior: ['base', 'pauseGame', 'mymodule.trap'] } },
        CONST: { REGION_EVENTS: { TOKEN_ENTER: 'tokenEnter', TOKEN_EXIT: 'tokenExit' } },
        CONFIG: {
          RegionBehavior: {
            dataModels: { modifyMovementCost: { schema: { fields: { difficulties: { fields: { walk: {}, fly: {} } } } } } }
          }
        }
      }),
      () => 13
    );

    expect(catalog.registeredTypes()).toEqual(['pauseGame', 'mymodule.trap']);
    expect(catalog.regionEvents()).toEqual(['tokenEnter', 'tokenExit']);
    expect(catalog.movementCostActions()).toEqual(['walk', 'fly']);
    expect(catalog.extendedTeleport()).toBe(false);
  });

  it('answers null for what the client does not expose', () => {
    const catalog = new FoundryRegionBehaviorCatalog(() => ({}), () => 14);
    expect(catalog.registeredTypes()).toBeNull();
    expect(catalog.regionEvents()).toBeNull();
    expect(catalog.movementCostActions()).toBeNull();
    expect(catalog.extendedTeleport()).toBe(true);
  });
});
