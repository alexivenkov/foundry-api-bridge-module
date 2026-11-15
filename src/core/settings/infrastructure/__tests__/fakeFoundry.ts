import type { FoundryClientSettings, FoundrySettingConfig, FoundrySettingsGlobals } from '../foundrySettingTypes';

// The class tree of `foundry.data.fields` as the probe printed it on 13.351 and
// 14.368 (SetField < ArrayField, ColorField / JSONField < StringField, …).
interface FieldOptions {
  nullable?: boolean;
  choices?: unknown;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  label?: string;
}

export class DataField {
  nullable: boolean;
  choices: unknown;
  min: number | undefined;
  max: number | undefined;
  step: number | undefined;
  integer: boolean;
  label: string | undefined;
  constructor(options: FieldOptions = {}) {
    this.nullable = options.nullable ?? false;
    this.choices = options.choices;
    this.min = options.min;
    this.max = options.max;
    this.step = options.step;
    this.integer = options.integer ?? false;
    this.label = options.label;
  }
}
export class BooleanField extends DataField {}
export class NumberField extends DataField {
  constructor(options: FieldOptions = {}) {
    super({ nullable: true, ...options });
  }
}
export class StringField extends DataField {}
export class ColorField extends StringField {}
export class JSONField extends StringField {}
export class ArrayField extends DataField {}
export class SetField extends ArrayField {}
export class ObjectField extends DataField {}
export class SchemaField extends DataField {}
export class EmbeddedDataField extends SchemaField {}
export class AnyField extends DataField {}
export class DataModel {
  constructor(private readonly source: Record<string, unknown>) {}
  toJSON(): Record<string, unknown> {
    return { ...this.source };
  }
}
export class DataModelValidationError extends Error {}
/** Foundry 14 throws this bare object, which is not an Error. */
export class DataModelValidationFailure {
  constructor(
    readonly message: string,
    private readonly detail: string
  ) {}
  toString(): string {
    return `${this.message}\n${this.detail}`;
  }
}

export const fakeFoundry: FoundrySettingsGlobals['foundry'] = {
  data: {
    fields: { DataField, BooleanField, NumberField, StringField, JSONField, ArrayField, ObjectField, SchemaField },
    validation: { DataModelValidationError, DataModelValidationFailure }
  },
  abstract: { DataModel }
};

export class FakeClientSettings implements FoundryClientSettings {
  readonly settings = new Map<string, FoundrySettingConfig>();
  readonly values = new Map<string, unknown>();
  readonly set = jest.fn((namespace: string, key: string, value: unknown): Promise<unknown> => {
    this.values.set(`${namespace}.${key}`, value);
    return Promise.resolve(value);
  });

  register(namespace: string, key: string, config: Omit<FoundrySettingConfig, 'namespace' | 'key'>): void {
    this.settings.set(`${namespace}.${key}`, { ...config, namespace, key, id: `${namespace}.${key}` });
  }

  get(namespace: string, key: string): unknown {
    const id = `${namespace}.${key}`;
    return this.values.has(id) ? this.values.get(id) : this.settings.get(id)?.default;
  }
}

export function globalsFor(settings: FakeClientSettings, localize = (key: string): string => key): () => FoundrySettingsGlobals {
  return () => ({ game: { settings, i18n: { localize } }, foundry: fakeFoundry });
}
