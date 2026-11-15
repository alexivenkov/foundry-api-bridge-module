import type { SettingChoice, SettingRange, SettingValueType } from '@/core/settings/domain';
import type {
  FoundryDataFieldLike,
  FoundryFieldClasses,
  FoundrySettingConfig,
  FoundrySettingsGlobals
} from './foundrySettingTypes';

/** What the registered `type` says about the values a setting holds; choice labels are not localized yet. */
export interface SettingTypeTraits {
  readonly valueType: SettingValueType;
  readonly choices: SettingChoice[] | null;
  readonly range: SettingRange | null;
  readonly acceptsNull: boolean;
  /** The label a DataField type carries, used when the setting has no name. */
  readonly label: unknown;
}

const PLAIN_TYPES = new Map<unknown, SettingValueType>([
  [String, 'string'],
  [Number, 'number'],
  [Boolean, 'boolean'],
  [Array, 'array'],
  [Object, 'object']
]);

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function choiceLabel(label: unknown, fallback: string): string {
  if (typeof label === 'string') {
    return label;
  }
  if (typeof label === 'object' && label !== null && typeof (label as { label?: unknown }).label === 'string') {
    return (label as { label: string }).label;
  }
  return fallback;
}

function resolveChoices(raw: unknown): unknown {
  if (typeof raw !== 'function') {
    return raw;
  }
  try {
    return (raw as () => unknown)();
  } catch {
    return null;
  }
}

// Choice keys of an object are strings; a numeric setting stores the number they spell.
function parseChoices(raw: unknown, numeric: boolean): SettingChoice[] | null {
  const resolved = resolveChoices(raw);
  let choices: SettingChoice[] = [];
  if (Array.isArray(resolved)) {
    choices = resolved
      .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
      .map((value) => ({ value, label: String(value) }));
  } else if (typeof resolved === 'object' && resolved !== null) {
    choices = Object.entries(resolved).map(([key, label]) => {
      const asNumber = Number(key);
      const value = numeric && key.trim() !== '' && Number.isFinite(asNumber) ? asNumber : key;
      return { value, label: choiceLabel(label, key) };
    });
  }
  return choices.length > 0 ? choices : null;
}

function parseRange(raw: unknown, integer: boolean): SettingRange | null {
  const source = typeof raw === 'object' && raw !== null ? (raw as { min?: unknown; max?: unknown; step?: unknown }) : {};
  const range = {
    min: finiteOrNull(source.min),
    max: finiteOrNull(source.max),
    step: finiteOrNull(source.step) ?? (integer ? 1 : null)
  };
  return range.min === null && range.max === null && range.step === null ? null : range;
}

function fieldValueType(field: object, fields: FoundryFieldClasses): SettingValueType {
  if (fields.JSONField !== undefined && field instanceof fields.JSONField) {
    return 'unknown';
  }
  if (field instanceof fields.BooleanField) {
    return 'boolean';
  }
  if (field instanceof fields.NumberField) {
    return 'number';
  }
  if (field instanceof fields.StringField) {
    return 'string';
  }
  if (field instanceof fields.ArrayField) {
    return 'array';
  }
  if (field instanceof fields.ObjectField || field instanceof fields.SchemaField) {
    return 'object';
  }
  return 'unknown';
}

function fieldTraits(field: FoundryDataFieldLike & object, fields: FoundryFieldClasses): SettingTypeTraits {
  const valueType = fieldValueType(field, fields);
  const hasChoices = valueType === 'string' || valueType === 'number';
  return {
    valueType,
    choices: hasChoices ? parseChoices(field.choices, valueType === 'number') : null,
    range: valueType === 'number' ? parseRange(field, field.integer === true) : null,
    acceptsNull: field.nullable === true,
    label: field.label
  };
}

/**
 * Mirrors how the core treats a registered type: a DataField instance cleans
 * and validates, a DataModel class is built strictly, a plain constructor
 * (`String`, `Number`, …) only casts, and a missing or custom type passes the
 * value through.
 */
export function classifySettingType(
  config: FoundrySettingConfig,
  foundry: FoundrySettingsGlobals['foundry']
): SettingTypeTraits {
  const { type } = config;
  const { fields } = foundry.data;

  if (typeof type === 'object' && type !== null && type instanceof fields.DataField) {
    return fieldTraits(type as FoundryDataFieldLike & object, fields);
  }
  if (typeof type === 'function' && (type as { prototype?: unknown }).prototype instanceof foundry.abstract.DataModel) {
    return { valueType: 'object', choices: null, range: null, acceptsNull: false, label: null };
  }

  const plainType = PLAIN_TYPES.get(type);
  if (plainType !== undefined) {
    return {
      valueType: plainType,
      choices: plainType === 'boolean' ? null : parseChoices(config.choices, plainType === 'number'),
      range: plainType === 'number' ? parseRange(config.range, false) : null,
      acceptsNull: config.default === null || config.default === undefined,
      label: null
    };
  }
  return {
    valueType: 'unknown',
    choices: parseChoices(config.choices, false),
    range: null,
    acceptsNull: true,
    label: null
  };
}
