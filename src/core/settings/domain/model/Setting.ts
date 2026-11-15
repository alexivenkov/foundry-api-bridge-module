export const SETTING_SCOPES = ['world', 'client', 'user'] as const;
export type SettingScope = (typeof SETTING_SCOPES)[number];

export const SETTING_VALUE_TYPES = ['string', 'number', 'boolean', 'array', 'object', 'unknown'] as const;
export type SettingValueType = (typeof SETTING_VALUE_TYPES)[number];

export type SettingAccess = 'read-write' | 'read-only' | 'none';

export interface SettingChoice {
  readonly value: string | number;
  readonly label: string;
}

export interface SettingRange {
  readonly min: number | null;
  readonly max: number | null;
  readonly step: number | null;
}

/** A registered setting as the registry describes it; values are plain JSON. */
export interface SettingDefinition {
  /** `<namespace>.<key>`. */
  readonly id: string;
  readonly namespace: string;
  readonly key: string;
  readonly name: string | null;
  readonly hint: string | null;
  readonly scope: SettingScope;
  readonly config: boolean;
  readonly valueType: SettingValueType;
  readonly choices: readonly SettingChoice[] | null;
  readonly range: SettingRange | null;
  /** Whether `null` is a value the setting can hold. */
  readonly acceptsNull: boolean;
  readonly requiresReload: boolean;
  readonly defaultValue: unknown;
}

export interface SettingEntry {
  readonly definition: SettingDefinition;
  readonly access: SettingAccess;
}

export interface SettingValueEntry extends SettingEntry {
  readonly value: unknown;
}
