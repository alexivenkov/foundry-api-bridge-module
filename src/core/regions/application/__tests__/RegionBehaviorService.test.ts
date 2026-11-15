import { CoreFeatureUnavailableError } from '../../../shared';
import { ValidationError } from '../../../../kernel';
import {
  RegionBehaviorCreationFailedError,
  RegionBehaviorNotFoundError,
  RegionMacroNotFoundError,
  RegionNotFoundError,
  ScriptBehaviorsDisabledError,
  ScriptMacroTargetDisabledError,
  UnregisteredBehaviorTypeError
} from '../../domain';
import { ScriptMacrosDisabledError } from '../../../macros';
import { zodBehaviorConfigReader } from '../../validation';
import { RegionBehaviorService } from '../RegionBehaviorService';
import {
  FakeBehaviorCatalog,
  FakeMacroResolver,
  FakeRegionBehaviorStore,
  FakeRegionStore,
  FakeSceneLocator,
  FakeScriptPolicy,
  V13_FEATURES,
  behavior,
  region
} from './fakePorts';

interface Setup {
  service: RegionBehaviorService;
  regions: FakeRegionStore;
  behaviors: FakeRegionBehaviorStore;
  catalog: FakeBehaviorCatalog;
  scripts: FakeScriptPolicy;
  macros: FakeMacroResolver;
}

function setup(allowScripts = false): Setup {
  const regions = new FakeRegionStore({
    s1: [
      region({
        behaviors: [
          behavior(),
          behavior({ id: 'script', type: 'executeScript', config: { kind: 'executeScript', settings: { events: [], source: '' } } }),
          behavior({
            id: 'gm-macro',
            type: 'executeMacro',
            config: { kind: 'executeMacro', settings: { events: [], macroUuid: 'Macro.scriptscriptscri', everyone: false } }
          })
        ]
      })
    ]
  });
  const behaviors = new FakeRegionBehaviorStore();
  const catalog = new FakeBehaviorCatalog();
  const scripts = new FakeScriptPolicy(allowScripts);
  const macros = new FakeMacroResolver();
  const service = new RegionBehaviorService({
    scenes: new FakeSceneLocator(['s1'], 's1'),
    regions,
    behaviors,
    catalog,
    scripts,
    configs: zodBehaviorConfigReader,
    macros
  });
  return { service, regions, behaviors, catalog, scripts, macros };
}

describe('RegionBehaviorService', () => {
  describe('createBehavior', () => {
    it('reads the config into the settings of the type', async () => {
      const { service, behaviors } = setup();
      const result = await service.createBehavior({
        sceneId: undefined,
        regionId: 'r1',
        type: 'executeMacro',
        name: 'Alarm',
        config: { events: ['tokenEnter'], macroUuid: 'Macro.chatchatchatchat' }
      });

      expect(result).toMatchObject({ sceneId: 's1', regionId: 'r1', behavior: { id: 'created' } });
      expect(behaviors.created).toEqual([
        {
          sceneId: 's1',
          regionId: 'r1',
          draft: {
            type: 'executeMacro',
            name: 'Alarm',
            disabled: undefined,
            config: { kind: 'executeMacro', settings: { events: ['tokenEnter'], macroUuid: 'Macro.chatchatchatchat' } }
          }
        }
      ]);
    });

    it('passes the config of a module type through', async () => {
      const { service, behaviors } = setup();
      await service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'mymodule.trap', config: { damage: '2d6' } });
      expect(behaviors.created[0]?.draft.config).toEqual({ kind: 'opaque', data: { damage: '2d6' } });
    });

    it('refuses a type the world does not register', async () => {
      const { service, behaviors } = setup();
      await expect(
        service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'defineSurface' })
      ).rejects.toThrow(UnregisteredBehaviorTypeError);
      expect(behaviors.created).toEqual([]);
    });

    it('skips the type check when the world cannot list its types', async () => {
      const { service, catalog } = setup();
      catalog.types = null;
      await expect(service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'anything' })).resolves.toBeDefined();
    });

    it('rejects an invalid config with its path', async () => {
      const { service } = setup();
      await expect(
        service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'adjustDarknessLevel', config: { modifier: 2 } })
      ).rejects.toThrow(ValidationError);
      await expect(
        service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'adjustDarknessLevel', config: { modifier: 2 } })
      ).rejects.toThrow(/^config\.modifier: /);
    });

    it('refuses an event the running core does not have', async () => {
      const { service } = setup();
      await expect(
        service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'executeMacro', config: { events: ['regionAnimation'] } })
      ).rejects.toThrow(new CoreFeatureUnavailableError('Region event regionAnimation is not available in this Foundry version'));
    });

    it('refuses a movement action without its own difficulty', async () => {
      const { service } = setup();
      await expect(
        service.createBehavior({
          sceneId: 's1',
          regionId: 'r1',
          type: 'modifyMovementCost',
          config: { difficulties: { crawl: 2 } }
        })
      ).rejects.toThrow('modifyMovementCost has no difficulty for movement action crawl (actions: walk, fly, swim, burrow)');
    });

    it('refuses Foundry 14 teleport options on an older core', async () => {
      const { service } = setup();
      const two = ['Scene.aaaaaaaaaaaaaaaa.Region.bbbbbbbbbbbbbbbb', 'Scene.aaaaaaaaaaaaaaaa.Region.cccccccccccccccc'];
      await expect(
        service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'teleportToken', config: { destinationUuids: two } })
      ).rejects.toThrow('Teleporting to several destination regions requires Foundry 14 or newer');
      await expect(
        service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'teleportToken', config: { placement: 'center' } })
      ).rejects.toThrow('Teleport option placement requires Foundry 14 or newer');
    });

    it('accepts them on Foundry 14', async () => {
      const { service, catalog } = setup();
      catalog.extended = true;
      await expect(
        service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'teleportToken', config: { placement: 'center' } })
      ).resolves.toBeDefined();
    });

    it('needs the script opt-in for a script behavior, before reading its config', async () => {
      const { service, behaviors } = setup(false);
      await expect(
        service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'executeScript', config: { source: 42 } })
      ).rejects.toThrow(new ScriptBehaviorsDisabledError());
      expect(behaviors.created).toEqual([]);

      const allowed = setup(true);
      await expect(
        allowed.service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'executeScript', config: { source: 'return 1' } })
      ).resolves.toBeDefined();
    });

    it('does not consult the policy for other types', async () => {
      const { service, scripts } = setup(false);
      await service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'pauseGame' });
      expect(scripts.checks).toBe(0);
    });

    it('reports a vetoed creation, a missing region and missing regions support', async () => {
      const { service, behaviors, regions } = setup();
      behaviors.createsNothing = true;
      await expect(service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'pauseGame' })).rejects.toThrow(
        new RegionBehaviorCreationFailedError()
      );
      await expect(service.createBehavior({ sceneId: 's1', regionId: 'zz', type: 'pauseGame' })).rejects.toThrow(
        new RegionNotFoundError('zz')
      );
      regions.featureSet = { ...V13_FEATURES, available: false };
      await expect(service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'pauseGame' })).rejects.toThrow(
        'Regions require Foundry 12 or newer'
      );
    });
  });

  describe('updateBehavior', () => {
    it('merges a config of the current type', async () => {
      const { service, behaviors } = setup();
      await service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'b1', config: { once: true } });

      expect(behaviors.updated[0]?.changes).toEqual({
        type: undefined,
        name: undefined,
        disabled: undefined,
        config: { kind: 'pauseGame', settings: { once: true } }
      });
    });

    it('leaves the config alone when only the name changes', async () => {
      const { service, behaviors } = setup();
      await service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'b1', name: 'New', type: 'pauseGame' });
      expect(behaviors.updated[0]?.changes).toEqual({ type: undefined, name: 'New', disabled: undefined, config: undefined });
    });

    it('starts a new type from its defaults', async () => {
      const { service, behaviors } = setup();
      await service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'b1', type: 'suppressWeather' });
      expect(behaviors.updated[0]?.changes).toMatchObject({
        type: 'suppressWeather',
        config: { kind: 'suppressWeather', settings: {} }
      });
    });

    it('guards both ends of a change against scripts', async () => {
      const { service, behaviors } = setup(false);
      await expect(
        service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'script', disabled: true })
      ).rejects.toThrow(ScriptBehaviorsDisabledError);
      await expect(
        service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'b1', type: 'executeScript' })
      ).rejects.toThrow(ScriptBehaviorsDisabledError);
      expect(behaviors.updated).toEqual([]);
    });

    it('refuses a new type the world does not register', async () => {
      const { service } = setup();
      await expect(
        service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'b1', type: 'nope' })
      ).rejects.toThrow(UnregisteredBehaviorTypeError);
    });

    it('reports a missing behavior before and after the write', async () => {
      const { service, behaviors } = setup();
      await expect(service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'zz' })).rejects.toThrow(
        new RegionBehaviorNotFoundError('zz')
      );
      behaviors.losesBehaviorOnUpdate = true;
      await expect(service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'b1' })).rejects.toThrow(
        new RegionBehaviorNotFoundError('b1')
      );
    });
  });

  describe('deleteBehavior', () => {
    it('deletes even a script behavior without the opt-in', async () => {
      const { service, behaviors } = setup(false);
      await expect(service.deleteBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'script' })).resolves.toEqual({
        sceneId: 's1',
        regionId: 'r1',
        behaviorId: 'script'
      });
      expect(behaviors.deleted).toEqual([{ sceneId: 's1', regionId: 'r1', behaviorId: 'script' }]);
    });

    it('reports a missing behavior', async () => {
      const { service } = setup();
      await expect(service.deleteBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'zz' })).rejects.toThrow(
        RegionBehaviorNotFoundError
      );
    });
  });

  describe('executeMacro targets', () => {
    const macroCreate = (macroUuid: string | null) => ({
      sceneId: 's1',
      regionId: 'r1',
      type: 'executeMacro',
      config: { events: ['tokenEnter'], macroUuid }
    });

    it('lets a chat macro through without the opt-in', async () => {
      const { service, macros } = setup(false);
      await expect(service.createBehavior(macroCreate('Macro.chatchatchatchat'))).resolves.toBeDefined();
      expect(macros.lookups).toEqual(['Macro.chatchatchatchat']);
    });

    it('refuses a script macro, world or compendium, with the macros refusal', async () => {
      const { service, behaviors } = setup(false);
      await expect(service.createBehavior(macroCreate('Macro.scriptscriptscri'))).rejects.toThrow(ScriptMacroTargetDisabledError);
      await expect(
        service.createBehavior(macroCreate('Compendium.world.macros.Macro.scriptscriptscri'))
      ).rejects.toThrow(new ScriptMacrosDisabledError().message);
      expect(new ScriptMacroTargetDisabledError().message).toBe(new ScriptMacrosDisabledError().message);
      expect(behaviors.created).toEqual([]);
    });

    it('accepts a script macro once the world opted in', async () => {
      const { service } = setup(true);
      await expect(service.createBehavior(macroCreate('Macro.scriptscriptscri'))).resolves.toBeDefined();
    });

    it('refuses a UUID that names no macro, whatever the policy', async () => {
      const { service, behaviors } = setup(true);
      await expect(service.createBehavior(macroCreate('Macro.aaaaaaaaaaaaaaaa'))).rejects.toThrow(
        new RegionMacroNotFoundError('Macro.aaaaaaaaaaaaaaaa')
      );
      expect(new RegionMacroNotFoundError('Macro.x').message).toBe('Macro not found: Macro.x');
      expect(behaviors.created).toEqual([]);
    });

    it('resolves nothing without a target', async () => {
      const { service, macros } = setup(false);
      await service.createBehavior(macroCreate(null));
      await service.createBehavior({ sceneId: 's1', regionId: 'r1', type: 'executeMacro' });
      expect(macros.lookups).toEqual([]);
    });

    it('checks a switch to executeMacro and a changed target', async () => {
      const { service, behaviors } = setup(false);
      await expect(
        service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'b1', type: 'executeMacro', config: { macroUuid: 'Macro.scriptscriptscri' } })
      ).rejects.toThrow(ScriptMacroTargetDisabledError);
      await expect(
        service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'gm-macro', config: { macroUuid: 'Compendium.world.macros.Macro.scriptscriptscri' } })
      ).rejects.toThrow(ScriptMacroTargetDisabledError);
      await expect(
        service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'gm-macro', config: { macroUuid: 'Macro.chatchatchatchat' } })
      ).resolves.toBeDefined();
      expect(behaviors.updated).toHaveLength(1);
    });

    it('does not re-check an unchanged target, so a GM-made behavior stays editable', async () => {
      const { service, macros, behaviors } = setup(false);
      await service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'gm-macro', name: 'Renamed', disabled: true });
      await service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'gm-macro', config: { events: ['tokenExit'] } });
      await service.updateBehavior({
        sceneId: 's1',
        regionId: 'r1',
        behaviorId: 'gm-macro',
        config: { macroUuid: 'Macro.scriptscriptscri' }
      });
      await service.updateBehavior({ sceneId: 's1', regionId: 'r1', behaviorId: 'gm-macro', config: { macroUuid: null } });
      expect(macros.lookups).toEqual([]);
      expect(behaviors.updated).toHaveLength(4);
    });
  });
});
