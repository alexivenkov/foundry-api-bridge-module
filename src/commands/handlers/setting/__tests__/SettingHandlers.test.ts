import type { FoundrySettingsGlobals } from '../../../../core/settings';
import { createGetSettingHandler } from '../GetSettingHandler';
import { createGetSettingsHandler } from '../GetSettingsHandler';
import { createSetSettingHandler } from '../SetSettingHandler';

class DataField {}
class BooleanField extends DataField {}
class NumberField extends DataField {}
class StringField extends DataField {}
class ArrayField extends DataField {}
class ObjectField extends DataField {}
class SchemaField extends DataField {}
class DataModel {}

interface Registered {
  namespace: string;
  key: string;
  name?: string;
  scope?: string;
  config?: boolean;
  type?: unknown;
  default?: unknown;
  range?: unknown;
  requiresReload?: boolean;
}

function setup(): { wiring: { globals: () => FoundrySettingsGlobals }; set: jest.Mock } {
  const registered: Registered[] = [
    { namespace: 'core', key: 'fontSize', name: 'SETTINGS.FontSizeN', scope: 'client', config: true, type: Number, default: 5, range: { min: 1, max: 10, step: 1 } },
    { namespace: 'core', key: 'permissions', name: 'Permissions', scope: 'world', type: Object, default: {} },
    { namespace: 'dnd5e', key: 'rulesVersion', scope: 'world', config: true, type: String, default: 'modern', requiresReload: true },
    { namespace: 'foundry-api-bridge', key: 'apiKey', scope: 'client', config: true, type: String, default: '' }
  ];
  const settings = new Map(registered.map((r) => [`${r.namespace}.${r.key}`, r]));
  const values = new Map<string, unknown>([['core.fontSize', 7]]);
  const set = jest.fn((namespace: string, key: string, value: unknown) => {
    values.set(`${namespace}.${key}`, value);
    return Promise.resolve(value);
  });
  const globals = {
    game: {
      settings: {
        settings,
        get: (namespace: string, key: string) => {
          const id = `${namespace}.${key}`;
          return values.has(id) ? values.get(id) : settings.get(id)?.default;
        },
        set
      },
      i18n: { localize: (key: string) => (key === 'SETTINGS.FontSizeN' ? 'Font Size' : key) }
    },
    foundry: {
      data: { fields: { DataField, BooleanField, NumberField, StringField, ArrayField, ObjectField, SchemaField } },
      abstract: { DataModel }
    }
  } as unknown as FoundrySettingsGlobals;
  return { wiring: { globals: () => globals }, set };
}

describe('setting handlers', () => {
  describe('get-settings', () => {
    it("lists the settings without values and without the module's own", async () => {
      const result = await createGetSettingsHandler(setup().wiring)({});

      expect(result.settings.map((s) => s.id)).toEqual(['core.fontSize', 'core.permissions', 'dnd5e.rulesVersion']);
      expect(result.settings[0]).toEqual({
        id: 'core.fontSize',
        namespace: 'core',
        key: 'fontSize',
        name: 'Font Size',
        hint: null,
        scope: 'client',
        config: true,
        valueType: 'number',
        choices: null,
        range: { min: 1, max: 10, step: 1 },
        nullable: false,
        requiresReload: false,
        access: 'read-write'
      });
      expect(result.settings[1]?.access).toBe('read-only');
    });

    it('filters by namespace and scope', async () => {
      const result = await createGetSettingsHandler(setup().wiring)({ namespace: 'core', scope: 'world' });

      expect(result.settings.map((s) => s.id)).toEqual(['core.permissions']);
    });

    it('rejects an unknown scope', async () => {
      await expect(
        createGetSettingsHandler(setup().wiring)({ scope: 'everywhere' } as unknown as { scope: 'world' })
      ).rejects.toThrow('scope');
    });
  });

  describe('get-setting', () => {
    it('returns the value with its metadata and default', async () => {
      const result = await createGetSettingHandler(setup().wiring)({ namespace: 'core', key: 'fontSize' });

      expect(result).toMatchObject({ id: 'core.fontSize', value: 7, default: 5, access: 'read-write' });
    });

    it('rejects an unregistered setting', async () => {
      await expect(createGetSettingHandler(setup().wiring)({ namespace: 'core', key: 'nope' })).rejects.toThrow(
        'Setting not found: core.nope'
      );
    });

    it("refuses the module's own settings", async () => {
      await expect(
        createGetSettingHandler(setup().wiring)({ namespace: 'foundry-api-bridge', key: 'apiKey' })
      ).rejects.toThrow("The settings of 'foundry-api-bridge' belong to the API bridge itself");
    });

    it('rejects a missing key', async () => {
      await expect(
        createGetSettingHandler(setup().wiring)({ namespace: 'core' } as { namespace: string; key: string })
      ).rejects.toThrow('key');
    });
  });

  describe('set-setting', () => {
    it('sets the value and reports the change and the reload need', async () => {
      const { wiring, set } = setup();

      const result = await createSetSettingHandler(wiring)({ namespace: 'dnd5e', key: 'rulesVersion', value: 'legacy' });

      expect(set).toHaveBeenCalledWith('dnd5e', 'rulesVersion', 'legacy');
      expect(result).toMatchObject({ value: 'legacy', previousValue: 'modern', changed: true, requiresReload: true });
    });

    it('refuses a value of the wrong type without writing', async () => {
      const { wiring, set } = setup();

      await expect(createSetSettingHandler(wiring)({ namespace: 'core', key: 'fontSize', value: 'big' })).rejects.toThrow(
        'Invalid value for setting core.fontSize: expected a number'
      );
      expect(set).not.toHaveBeenCalled();
    });

    it('refuses the permission table', async () => {
      await expect(
        createSetSettingHandler(setup().wiring)({ namespace: 'core', key: 'permissions', value: {} })
      ).rejects.toThrow('Setting core.permissions is read-only through the API');
    });

    it('rejects an unregistered setting and a missing value', async () => {
      const handler = createSetSettingHandler(setup().wiring);

      await expect(handler({ namespace: 'core', key: 'nope', value: 1 })).rejects.toThrow('Setting not found: core.nope');
      await expect(handler({ namespace: 'core', key: 'fontSize' } as { namespace: string; key: string; value: unknown })).rejects.toThrow(
        'value'
      );
    });
  });
});
