import {
  CredentialSettingError,
  InvalidSettingValueError,
  ProtectedSettingNamespaceError,
  ReadOnlySettingError,
  SettingNotFoundError
} from '../../domain';
import { SettingService } from '../SettingService';
import { FakeSettingRegistry, definition } from './fakePorts';

const OWN = 'foundry-api-bridge';

function setup(): { service: SettingService; registry: FakeSettingRegistry } {
  const registry = new FakeSettingRegistry(
    [
      definition(),
      definition({ key: 'permissions', scope: 'world', valueType: 'object', range: null, defaultValue: {} }),
      definition({ key: 'rtcWorldSettings', scope: 'world', valueType: 'object', range: null, defaultValue: { turn: { password: '' } } }),
      definition({ namespace: 'dnd5e', key: 'rulesVersion', scope: 'world', valueType: 'string', range: null, requiresReload: true, defaultValue: 'modern' }),
      definition({ namespace: 'my-mod', key: 'apiKey', valueType: 'string', range: null, defaultValue: '' }),
      definition({ namespace: OWN, key: 'wsUrl', scope: 'world', valueType: 'string', range: null, defaultValue: 'wss://x' }),
      definition({ namespace: OWN, key: 'apiKey', valueType: 'string', range: null, defaultValue: '' })
    ],
    { 'core.fontSize': 7, 'core.permissions': { ACTOR_CREATE: [3, 4] } }
  );
  return { service: new SettingService({ settings: registry, protectedNamespace: OWN }), registry };
}

describe('SettingService', () => {
  describe('listSettings', () => {
    it("lists every registered setting except the module's own, with its access", () => {
      const entries = setup().service.listSettings({});

      expect(entries.map((e) => [e.definition.id, e.access])).toEqual([
        ['core.fontSize', 'read-write'],
        ['core.permissions', 'read-only'],
        ['core.rtcWorldSettings', 'none'],
        ['dnd5e.rulesVersion', 'read-write'],
        ['my-mod.apiKey', 'none']
      ]);
    });

    it('filters by namespace and scope', () => {
      const { service } = setup();

      expect(service.listSettings({ namespace: 'dnd5e' }).map((e) => e.definition.id)).toEqual(['dnd5e.rulesVersion']);
      expect(service.listSettings({ namespace: 'core', scope: 'world' }).map((e) => e.definition.id)).toEqual([
        'core.permissions',
        'core.rtcWorldSettings'
      ]);
      expect(service.listSettings({ namespace: OWN })).toEqual([]);
    });

    it('carries no values', () => {
      expect(setup().service.listSettings({})[0]).not.toHaveProperty('value');
    });
  });

  describe('getSetting', () => {
    it('returns the value with the metadata', () => {
      const entry = setup().service.getSetting({ namespace: 'core', key: 'fontSize' });

      expect(entry).toMatchObject({ value: 7, access: 'read-write', definition: { id: 'core.fontSize' } });
    });

    it('reads the permission table', () => {
      expect(setup().service.getSetting({ namespace: 'core', key: 'permissions' }).value).toEqual({ ACTOR_CREATE: [3, 4] });
    });

    it.each([
      ['an own setting', OWN, 'wsUrl', ProtectedSettingNamespaceError],
      ['an unregistered own setting', OWN, 'whatever', ProtectedSettingNamespaceError],
      ['a credential key', 'my-mod', 'apiKey', CredentialSettingError],
      ['an unregistered credential key', 'other', 'secret', CredentialSettingError],
      ['a setting holding a credential field', 'core', 'rtcWorldSettings', CredentialSettingError],
      ['an unregistered setting', 'core', 'nope', SettingNotFoundError]
    ] as const)('refuses %s', (_label, namespace, key, error) => {
      expect(() => setup().service.getSetting({ namespace, key })).toThrow(error);
    });

    it('names the missing setting', () => {
      expect(() => setup().service.getSetting({ namespace: 'core', key: 'nope' })).toThrow('Setting not found: core.nope');
    });
  });

  describe('setSetting', () => {
    it('writes the value and reports the change', async () => {
      const { service, registry } = setup();

      const result = await service.setSetting({ namespace: 'core', key: 'fontSize', value: 9 });

      expect(registry.writes).toEqual([{ id: 'core.fontSize', value: 9 }]);
      expect(result).toMatchObject({ value: 9, previousValue: 7, changed: true, access: 'read-write' });
    });

    it('reports an unchanged value', async () => {
      const result = await setup().service.setSetting({ namespace: 'core', key: 'fontSize', value: 7 });

      expect(result.changed).toBe(false);
    });

    it('passes requiresReload through without acting on it', async () => {
      const result = await setup().service.setSetting({ namespace: 'dnd5e', key: 'rulesVersion', value: 'legacy' });

      expect(result.definition.requiresReload).toBe(true);
      expect(result.changed).toBe(true);
    });

    it.each([
      ['an own setting', OWN, 'wsUrl', 'wss://evil', ProtectedSettingNamespaceError],
      ['a credential key', 'my-mod', 'apiKey', 'sk-1', CredentialSettingError],
      ['a setting holding a credential field', 'core', 'rtcWorldSettings', { mode: 1 }, CredentialSettingError],
      ['the permission table', 'core', 'permissions', {}, ReadOnlySettingError],
      ['an unregistered setting', 'core', 'nope', 1, SettingNotFoundError],
      ['a value of the wrong type', 'core', 'fontSize', '9', InvalidSettingValueError],
      ['a value out of range', 'core', 'fontSize', 11, InvalidSettingValueError]
    ] as const)('refuses %s and writes nothing', async (_label, namespace, key, value, error) => {
      const { service, registry } = setup();

      await expect(service.setSetting({ namespace, key, value })).rejects.toThrow(error);
      expect(registry.writes).toEqual([]);
    });

    it('surfaces the refusal of the core', async () => {
      const { service, registry } = setup();
      registry.rejectWith = 'must be an integer';

      await expect(service.setSetting({ namespace: 'core', key: 'fontSize', value: 3 })).rejects.toThrow(
        'Invalid value for setting core.fontSize: must be an integer'
      );
    });
  });
});
