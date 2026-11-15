import { InvalidSettingValueError, SettingValueNotRepresentableError, SettingWriteFailedError } from '../../domain';
import { FoundrySettingRegistry } from '../FoundrySettingRegistry';
import { coreErrorText } from '../coreErrorText';
import { toPlainJson, toPlainJsonOrNull } from '../plainJson';
import {
  AnyField,
  ArrayField,
  BooleanField,
  ColorField,
  DataModel,
  DataModelValidationError,
  DataModelValidationFailure,
  EmbeddedDataField,
  FakeClientSettings,
  JSONField,
  NumberField,
  ObjectField,
  SchemaField,
  SetField,
  StringField,
  globalsFor
} from './fakeFoundry';

class Config extends DataModel {}

function registryWith(register: (settings: FakeClientSettings) => void, localize?: (key: string) => string): {
  registry: FoundrySettingRegistry;
  settings: FakeClientSettings;
} {
  const settings = new FakeClientSettings();
  register(settings);
  return { registry: new FoundrySettingRegistry(globalsFor(settings, localize)), settings };
}

function only(register: (settings: FakeClientSettings) => void): ReturnType<FoundrySettingRegistry['listDefinitions']>[number] {
  const definition = registryWith(register).registry.listDefinitions()[0];
  if (definition === undefined) {
    throw new Error('no definition');
  }
  return definition;
}

describe('FoundrySettingRegistry', () => {
  describe('metadata', () => {
    it('maps a registered setting, localizing its texts', () => {
      const { registry } = registryWith(
        (s) => s.register('core', 'fontSize', { name: 'SETTINGS.FontSizeN', hint: 'SETTINGS.FontSizeL', scope: 'client', config: true, type: Number, range: { min: 1, max: 10, step: 1 }, default: 5, requiresReload: true }),
        (key) => `«${key}»`
      );

      expect(registry.findDefinition('core', 'fontSize')).toEqual({
        id: 'core.fontSize',
        namespace: 'core',
        key: 'fontSize',
        name: '«SETTINGS.FontSizeN»',
        hint: '«SETTINGS.FontSizeL»',
        scope: 'client',
        config: true,
        valueType: 'number',
        choices: null,
        range: { min: 1, max: 10, step: 1 },
        acceptsNull: false,
        requiresReload: true,
        defaultValue: 5
      });
    });

    it('reads a setting without texts, flags or scope', () => {
      expect(only((s) => s.register('m', 'k', { type: String, default: 'x' }))).toMatchObject({
        name: null,
        hint: null,
        scope: 'client',
        config: false,
        requiresReload: false
      });
    });

    it.each(['world', 'client', 'user'])('keeps the %s scope', (scope) => {
      expect(only((s) => s.register('m', 'k', { scope, type: Boolean, default: false })).scope).toBe(scope);
    });

    it('returns null for an unregistered setting', () => {
      expect(registryWith(() => undefined).registry.findDefinition('core', 'nope')).toBeNull();
    });
  });

  describe('type classification', () => {
    it.each([
      ['String', String, 'x', 'string'],
      ['Number', Number, 1, 'number'],
      ['Boolean', Boolean, false, 'boolean'],
      ['Array', Array, [], 'array'],
      ['Object', Object, {}, 'object']
    ] as const)('reads the plain %s type', (_label, type, defaultValue, valueType) => {
      expect(only((s) => s.register('m', 'k', { type, default: defaultValue })).valueType).toBe(valueType);
    });

    it('lets a plain type hold null only when registered without a default', () => {
      expect(only((s) => s.register('m', 'k', { type: String, default: null })).acceptsNull).toBe(true);
      expect(only((s) => s.register('m', 'k', { type: String, default: '' })).acceptsNull).toBe(false);
    });

    it.each([
      ['BooleanField', new BooleanField(), 'boolean'],
      ['NumberField', new NumberField(), 'number'],
      ['StringField', new StringField(), 'string'],
      ['ColorField', new ColorField(), 'string'],
      ['JSONField', new JSONField(), 'unknown'],
      ['ArrayField', new ArrayField(), 'array'],
      ['SetField', new SetField(), 'array'],
      ['ObjectField', new ObjectField(), 'object'],
      ['SchemaField', new SchemaField(), 'object'],
      ['EmbeddedDataField', new EmbeddedDataField(), 'object'],
      ['AnyField', new AnyField(), 'unknown']
    ])('reads a %s', (_label, type, valueType) => {
      expect(only((s) => s.register('m', 'k', { type, default: null })).valueType).toBe(valueType);
    });

    it('takes nullability from the field', () => {
      expect(only((s) => s.register('m', 'k', { type: new NumberField({ nullable: true }) })).acceptsNull).toBe(true);
      expect(only((s) => s.register('m', 'k', { type: new BooleanField() })).acceptsNull).toBe(false);
    });

    it('reads a DataModel class as an object that cannot be null', () => {
      expect(only((s) => s.register('m', 'k', { type: Config, default: {} }))).toMatchObject({ valueType: 'object', acceptsNull: false });
    });

    it('reads a missing or custom type as unknown and nullable', () => {
      class Custom {}
      expect(only((s) => s.register('m', 'k', { default: 1 }))).toMatchObject({ valueType: 'unknown', acceptsNull: true });
      expect(only((s) => s.register('m', 'k', { type: Custom, default: 1 }))).toMatchObject({ valueType: 'unknown', acceptsNull: true });
    });

    it('reads the range of a number field, with step 1 for an integer field', () => {
      expect(only((s) => s.register('m', 'k', { type: new NumberField({ min: 0, max: 100, step: 10 }) })).range).toEqual({ min: 0, max: 100, step: 10 });
      expect(only((s) => s.register('m', 'k', { type: new NumberField({ integer: true, min: 1 }) })).range).toEqual({ min: 1, max: null, step: 1 });
      expect(only((s) => s.register('m', 'k', { type: new NumberField() })).range).toBeNull();
    });

    it('ignores a range on a non-numeric setting', () => {
      expect(only((s) => s.register('m', 'k', { type: String, range: { min: 0 }, default: '' })).range).toBeNull();
    });
  });

  describe('choices', () => {
    it('reads plain choices, numeric keys as numbers for a numeric setting, labels localized', () => {
      const { registry } = registryWith(
        (s) => {
          s.register('m', 'mode', { type: Number, choices: { 0: 'MODE.Off', 1: 'MODE.On' }, default: 0 });
          s.register('m', 'look', { type: String, choices: { dark: 'Dark', light: 'Light' }, default: 'dark' });
        },
        (key) => key.replace('MODE.', '')
      );

      expect(registry.findDefinition('m', 'mode')?.choices).toEqual([
        { value: 0, label: 'Off' },
        { value: 1, label: 'On' }
      ]);
      expect(registry.findDefinition('m', 'look')?.choices).toEqual([
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' }
      ]);
    });

    it('reads field choices given as an array, an object of labels or a function', () => {
      expect(only((s) => s.register('m', 'k', { type: new NumberField({ choices: [0, 1, 2] }) })).choices).toEqual([
        { value: 0, label: '0' },
        { value: 1, label: '1' },
        { value: 2, label: '2' }
      ]);
      expect(only((s) => s.register('m', 'k', { type: new StringField({ choices: { a: { label: 'Alpha' } } }) })).choices).toEqual([
        { value: 'a', label: 'Alpha' }
      ]);
      expect(only((s) => s.register('m', 'k', { type: new StringField({ choices: () => ({ x: 'X' }) }) })).choices).toEqual([
        { value: 'x', label: 'X' }
      ]);
    });

    it('treats empty or broken choices as none', () => {
      expect(only((s) => s.register('m', 'k', { type: String, choices: {}, default: '' })).choices).toBeNull();
      const broken = (): never => {
        throw new Error('boom');
      };
      expect(only((s) => s.register('m', 'k', { type: new StringField({ choices: broken }) })).choices).toBeNull();
    });
  });

  describe('values', () => {
    it('returns plain JSON: a model by its own toJSON, a Set as an array', () => {
      const { registry, settings } = registryWith((s) => {
        s.register('m', 'model', { type: Config, default: {} });
        s.register('m', 'tags', { type: new SetField(), default: [] });
      });
      settings.values.set('m.model', new Config({ speed: 3 }));
      settings.values.set('m.tags', new Set(['a', 'b']));

      expect(registry.readValue(registry.findDefinition('m', 'model')!)).toEqual({ speed: 3 });
      expect(registry.readValue(registry.findDefinition('m', 'tags')!)).toEqual(['a', 'b']);
    });

    it('refuses a value that cannot be written as JSON', () => {
      const { registry, settings } = registryWith((s) => s.register('m', 'k', { type: Object, default: {} }));
      const cyclic: Record<string, unknown> = {};
      cyclic['self'] = cyclic;
      settings.values.set('m.k', cyclic);

      expect(() => registry.readValue(registry.findDefinition('m', 'k')!)).toThrow(SettingValueNotRepresentableError);
    });

    it('writes through game.settings.set', async () => {
      const { registry, settings } = registryWith((s) => s.register('m', 'k', { type: Number, default: 1 }));

      await registry.writeValue(registry.findDefinition('m', 'k')!, 4);

      expect(settings.set).toHaveBeenCalledWith('m', 'k', 4);
    });

    it('turns a validation error of Foundry 13 into an invalid value', async () => {
      const { registry, settings } = registryWith((s) => s.register('m', 'k', { type: new ArrayField() }));
      settings.set.mockRejectedValueOnce(new DataModelValidationError('\n  0: must be a finite number'));

      await expect(registry.writeValue(registry.findDefinition('m', 'k')!, ['x'])).rejects.toThrow(
        new InvalidSettingValueError('m.k', '0: must be a finite number').message
      );
    });

    it('turns the bare validation failure of Foundry 14 into an invalid value', async () => {
      const { registry, settings } = registryWith((s) => s.register('m', 'k', { type: new ArrayField() }));
      settings.set.mockRejectedValueOnce(new DataModelValidationFailure('ArrayField#_validateRecursive', '  0: must be a number'));

      await expect(registry.writeValue(registry.findDefinition('m', 'k')!, ['x'])).rejects.toThrow(
        'Invalid value for setting m.k: 0: must be a number'
      );
    });

    it('reports any other failure as a failed write', async () => {
      const { registry, settings } = registryWith((s) => s.register('m', 'k', { type: Number, default: 1 }));
      settings.set.mockRejectedValueOnce(new Error('You may not set a World-level Setting before the Game is ready.'));

      const write = registry.writeValue(registry.findDefinition('m', 'k')!, 2);
      await expect(write).rejects.toThrow(SettingWriteFailedError);
      await expect(write).rejects.toThrow(
        'Failed to set setting m.k: You may not set a World-level Setting before the Game is ready.'
      );
    });
  });
});

describe('coreErrorText', () => {
  // Texts as the probe captured them from the installed cores.
  it.each([
    ['v13 field', new Error('must be a finite number'), 'must be a finite number'],
    ['v13 nested', new Error('\n  a: must be a finite number\n  b: must be a finite number'), 'a: must be a finite number; b: must be a finite number'],
    ['v13 model', new Error('Cfg validation errors:\n  speed: must be an integer'), 'Cfg validation errors: speed: must be an integer'],
    ['v14 model', new Error('[Cfg] validation errors: SchemaField#_validateRecursive\n  speed: must be a number'), '[Cfg] validation errors: speed: must be a number'],
    ['v14 failure', new DataModelValidationFailure('SchemaField#_validateRecursive', '  a: must be a number'), 'a: must be a number'],
    ['empty', new Error(''), 'the core rejected it']
  ])('cleans the %s text', (_label, error, expected) => {
    expect(coreErrorText(error)).toBe(expected);
  });
});

describe('toPlainJson', () => {
  it('serializes nested Sets and Maps and drops functions', () => {
    expect(toPlainJson({ s: new Set([1]), m: new Map([['a', 1]]), f: () => 1 })).toEqual({ s: [1], m: { a: 1 } });
  });

  it('reads undefined as null', () => {
    expect(toPlainJson(undefined)).toBeNull();
    expect(toPlainJsonOrNull(BigInt(1))).toBeNull();
  });
});
