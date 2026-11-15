import {
  V13_SOURCE,
  V14_SOURCE,
  fakeBehavior,
  fakeRegion,
  fakeScene,
  gameWith,
  globalsWith,
  type FakeRegion,
  type FakeScene
} from '../../../../core/regions/infrastructure/__tests__/fakeFoundry';
import type { RegionHandlerDependencies } from '../GetRegionsHandler';
import { createGetRegionsHandler } from '../GetRegionsHandler';
import { createGetRegionHandler } from '../GetRegionHandler';
import { createCreateRegionHandler } from '../CreateRegionHandler';
import { createUpdateRegionHandler } from '../UpdateRegionHandler';
import { createDeleteRegionHandler } from '../DeleteRegionHandler';
import { createCreateRegionBehaviorHandler } from '../CreateRegionBehaviorHandler';
import { createUpdateRegionBehaviorHandler } from '../UpdateRegionBehaviorHandler';
import { createDeleteRegionBehaviorHandler } from '../DeleteRegionBehaviorHandler';
import { createGetRegionTokensHandler } from '../GetRegionTokensHandler';
import { createTestRegionPointHandler } from '../TestRegionPointHandler';

interface World {
  deps: RegionHandlerDependencies;
  scene: FakeScene;
  region: FakeRegion;
}

function world(generation = 13, allowScripts = false): World {
  const script = fakeBehavior({
    _id: 'script',
    name: 'Boom',
    type: 'executeScript',
    disabled: false,
    system: { events: ['tokenEnter'], source: 'return 1' }
  });
  const pause = fakeBehavior({ _id: 'b1', name: 'Halt', type: 'pauseGame', disabled: false, system: { once: false } });
  const region = fakeRegion(V13_SOURCE, [pause, script]);
  const scene = fakeScene('S', [region]);
  const deps: RegionHandlerDependencies = {
    gameProvider: gameWith(scene),
    globals: globalsWith({
      game: { documentTypes: { RegionBehavior: ['pauseGame', 'executeMacro', 'executeScript', 'teleportToken', 'mymodule.trap'] } },
      CONST: { REGION_EVENTS: { TOKEN_ENTER: 'tokenEnter', TOKEN_EXIT: 'tokenExit' } }
    }),
    generation: () => generation,
    scripts: { allowsScripts: () => allowScripts }
  };
  return { deps, scene, region };
}

describe('region handlers', () => {
  it('get-regions lists the active scene with a behavior summary', async () => {
    const { deps } = world();
    const result = await createGetRegionsHandler(deps)({});

    expect(result).toEqual({
      sceneId: 'S',
      regions: [
        {
          id: 'r1',
          name: 'Trap',
          color: '#ff0000',
          shapes: [
            { type: 'rectangle', x: 0, y: 0, width: 100, height: 50, rotation: 30, hole: false },
            { type: 'circle', x: 10, y: 10, radius: 5, hole: true },
            { type: 'ellipse', x: 1, y: 2, radiusX: 3, radiusY: 4, rotation: 0, hole: false },
            { type: 'polygon', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 80 }], hole: false }
          ],
          elevation: { bottom: 0, top: 10 },
          visibility: 'gamemaster',
          locked: true,
          behaviors: [
            { id: 'b1', name: 'Halt', type: 'pauseGame', disabled: false },
            { id: 'script', name: 'Boom', type: 'executeScript', disabled: false }
          ]
        }
      ]
    });
  });

  it('get-region returns the behaviors with their config, Foundry 14 fields included', async () => {
    const { deps, scene } = world(14);
    scene.regions?.contents.push(fakeRegion(V14_SOURCE));
    const result = await createGetRegionHandler(deps)({ regionId: 'r1' });
    expect(result.sceneId).toBe('S');
    expect(result.behaviors).toEqual([
      { id: 'b1', name: 'Halt', type: 'pauseGame', disabled: false, config: { once: false } },
      { id: 'script', name: 'Boom', type: 'executeScript', disabled: false, config: { events: ['tokenEnter'], source: 'return 1' } }
    ]);

    const extended = await createGetRegionHandler(deps)({ regionId: 'r2' });
    expect(extended).toMatchObject({
      elevation: { bottom: 0, top: 5, topInclusive: true },
      levelIds: ['llllllllllllllll'],
      attachedTokenId: 'tttttttttttttttt',
      hidden: true
    });
  });

  it('answers not found and validation errors', async () => {
    const { deps } = world();
    await expect(createGetRegionHandler(deps)({ regionId: 'zz' })).rejects.toThrow('Region not found: zz');
    await expect(createGetRegionsHandler(deps)({ sceneId: 'nope' })).rejects.toThrow('Scene not found: nope');
    await expect(
      createCreateRegionHandler(deps)({ name: 'X', shapes: [{ type: 'circle', x: 0, y: 0, radius: -1 }] })
    ).rejects.toThrow(/^shapes\.0\.radius: /);
  });

  it('refuses everything before Foundry 12', async () => {
    const { deps } = world(11);
    await expect(createGetRegionsHandler(deps)({})).rejects.toThrow('Regions require Foundry 12 or newer');
  });

  it('create-region writes the core payload and returns the snapshot with the scene', async () => {
    const { deps, scene } = world();
    scene.createEmbeddedDocuments.mockResolvedValue([fakeRegion({ ...V13_SOURCE, _id: 'new', name: 'Pit' })]);

    const result = await createCreateRegionHandler(deps)({
      sceneId: '',
      name: 'Pit',
      elevation: { bottom: 0, top: null },
      shapes: [{ type: 'polygon', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }] }]
    });

    expect(scene.createEmbeddedDocuments).toHaveBeenCalledWith('Region', [
      { name: 'Pit', shapes: [{ type: 'polygon', points: [0, 0, 10, 0, 0, 10] }], elevation: { bottom: 0, top: null } }
    ]);
    expect(result).toMatchObject({ sceneId: 'S', id: 'new', name: 'Pit' });
  });

  it('create-region refuses Foundry 14 shapes on Foundry 13', async () => {
    const { deps, scene } = world(13);
    await expect(
      createCreateRegionHandler(deps)({ name: 'X', shapes: [{ type: 'line', x: 0, y: 0, length: 5, width: 1 }] })
    ).rejects.toThrow('Region shape type line requires Foundry 14 or newer');
    expect(scene.createEmbeddedDocuments).not.toHaveBeenCalled();
  });

  it('update-region and delete-region act on the region', async () => {
    const { deps, region, scene } = world();
    const updated = await createUpdateRegionHandler(deps)({ regionId: 'r1', name: 'Renamed', locked: false });
    expect(region.update).toHaveBeenCalledWith({ name: 'Renamed', locked: false });
    expect(updated.name).toBe('Renamed');

    await expect(createDeleteRegionHandler(deps)({ regionId: 'r1' })).resolves.toEqual({
      deleted: true,
      regionId: 'r1',
      sceneId: 'S'
    });
    expect(scene.deleteEmbeddedDocuments).toHaveBeenCalledWith('Region', ['r1']);
  });

  it('create-region-behavior validates the config and returns the behavior with its region', async () => {
    const { deps, region } = world();
    region.createEmbeddedDocuments.mockResolvedValue([
      fakeBehavior({ _id: 'nb', name: 'Gate', type: 'teleportToken', disabled: false, system: { destination: null, choice: true } })
    ]);

    const result = await createCreateRegionBehaviorHandler(deps)({
      regionId: 'r1',
      type: 'teleportToken',
      name: 'Gate',
      config: { choice: true }
    });

    expect(region.createEmbeddedDocuments).toHaveBeenCalledWith('RegionBehavior', [
      { type: 'teleportToken', system: { choice: true }, name: 'Gate' }
    ]);
    expect(result).toEqual({
      id: 'nb',
      name: 'Gate',
      type: 'teleportToken',
      disabled: false,
      config: { destinationUuids: [], choice: true },
      sceneId: 'S',
      regionId: 'r1'
    });
  });

  it('create-region-behavior refuses a script behavior without the opt-in', async () => {
    const { deps, region } = world(13, false);
    await expect(
      createCreateRegionBehaviorHandler(deps)({ regionId: 'r1', type: 'executeScript', config: { source: 'return 2' } })
    ).rejects.toThrow(/^Script macros are disabled\./);
    expect(region.createEmbeddedDocuments).not.toHaveBeenCalled();
  });

  it('update-region-behavior guards a script behavior and merges others', async () => {
    const { deps, region } = world(13, false);
    await expect(
      createUpdateRegionBehaviorHandler(deps)({ regionId: 'r1', behaviorId: 'script', name: 'Renamed' })
    ).rejects.toThrow(/^Script macros are disabled\./);

    const result = await createUpdateRegionBehaviorHandler(deps)({ regionId: 'r1', behaviorId: 'b1', config: { once: true } });
    expect(region.behaviorDocs[0]?.update).toHaveBeenCalledWith({ system: { once: true } });
    expect(result).toMatchObject({ id: 'b1', config: { once: true }, regionId: 'r1', sceneId: 'S' });

    await expect(
      createUpdateRegionBehaviorHandler(deps)({ regionId: 'r1', behaviorId: 'zz' })
    ).rejects.toThrow('Region behavior not found: zz');
  });

  it('update-region-behavior lets a world that opted in edit scripts', async () => {
    const { deps, region } = world(13, true);
    await createUpdateRegionBehaviorHandler(deps)({ regionId: 'r1', behaviorId: 'script', config: { source: 'return 3' } });
    expect(region.behaviorDocs[1]?.update).toHaveBeenCalledWith({ system: { source: 'return 3' } });
  });

  it('delete-region-behavior removes the behavior', async () => {
    const { deps, region } = world();
    await expect(createDeleteRegionBehaviorHandler(deps)({ regionId: 'r1', behaviorId: 'script' })).resolves.toEqual({
      deleted: true,
      behaviorId: 'script',
      regionId: 'r1',
      sceneId: 'S'
    });
    expect(region.deleteEmbeddedDocuments).toHaveBeenCalledWith('RegionBehavior', ['script']);
  });

  it('get-region-tokens and test-region-point answer from the document', async () => {
    const { deps, region } = world();
    region.tokens = new Set([{ id: 't1', name: 'Goblin' }]);
    region.testPoint = jest.fn(() => false);

    await expect(createGetRegionTokensHandler(deps)({ regionId: 'r1' })).resolves.toEqual({
      sceneId: 'S',
      regionId: 'r1',
      tokens: [{ id: 't1', name: 'Goblin' }]
    });
    await expect(createTestRegionPointHandler(deps)({ regionId: 'r1', x: 500, y: 500, elevation: 2 })).resolves.toEqual({
      sceneId: 'S',
      regionId: 'r1',
      x: 500,
      y: 500,
      elevation: 2,
      inside: false
    });
    await expect(createTestRegionPointHandler(deps)({ regionId: 'r1', x: 1 } as never)).rejects.toThrow(/^y: /);
  });

  it('create-region-behavior refuses an executeMacro aimed at a script macro without the opt-in', async () => {
    const { deps, region } = world(13, false);
    const fromUuid = (uuid: string): Promise<unknown> =>
      Promise.resolve(uuid === 'Macro.scriptscriptscri' ? { documentName: 'Macro', type: 'script' } : null);
    const baseGlobals = deps.globals?.() ?? {};
    const withMacros: RegionHandlerDependencies = {
      ...deps,
      globals: () => ({ ...baseGlobals, foundry: { ...baseGlobals.foundry, utils: { ...baseGlobals.foundry?.utils, fromUuid } } })
    };

    await expect(
      createCreateRegionBehaviorHandler(withMacros)({ regionId: 'r1', type: 'executeMacro', config: { macroUuid: 'Macro.scriptscriptscri' } })
    ).rejects.toThrow(/^Script macros are disabled\. .*script-type macros via API\.$/);
    await expect(
      createCreateRegionBehaviorHandler(withMacros)({ regionId: 'r1', type: 'executeMacro', config: { macroUuid: 'Macro.aaaaaaaaaaaaaaaa' } })
    ).rejects.toThrow('Macro not found: Macro.aaaaaaaaaaaaaaaa');
    expect(region.createEmbeddedDocuments).not.toHaveBeenCalled();
  });
});

