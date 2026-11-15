/**
 * A registered setting as `ClientSettings#register` stores it in
 * `game.settings.settings` (`SettingConfig`, Foundry 13–14). Registering
 * packages fill it freely, so every field is read defensively.
 */
export interface FoundrySettingConfig {
  id?: unknown;
  key: string;
  namespace: string;
  name?: unknown;
  hint?: unknown;
  /** Normalized by `register`: `world`, `client` or (Foundry 13+) `user`. */
  scope?: unknown;
  config?: unknown;
  /** A constructor (`String`, `Number`, `Boolean`, `Array`, `Object`, a custom class), a DataField instance or a DataModel class. */
  type?: unknown;
  /** Value → label, for plainly typed settings. */
  choices?: unknown;
  /** `{ min, max, step }`, for plainly typed numeric settings. */
  range?: unknown;
  default?: unknown;
  requiresReload?: unknown;
}

export interface FoundryClientSettings {
  settings: Map<string, FoundrySettingConfig>;
  get(namespace: string, key: string): unknown;
  set(namespace: string, key: string, value: unknown): Promise<unknown>;
}

export interface FoundrySettingsGame {
  settings: FoundryClientSettings;
  i18n?: { localize(key: string): string } | undefined;
}

export type FoundryClass = abstract new (...args: never[]) => object;

/** The `foundry.data.fields` classes a setting type is classified by. */
export interface FoundryFieldClasses {
  DataField: FoundryClass;
  BooleanField: FoundryClass;
  NumberField: FoundryClass;
  StringField: FoundryClass;
  JSONField?: FoundryClass | undefined;
  ArrayField: FoundryClass;
  ObjectField: FoundryClass;
  SchemaField: FoundryClass;
}

/** The properties of a DataField instance the classifier reads. */
export interface FoundryDataFieldLike {
  nullable?: unknown;
  choices?: unknown;
  min?: unknown;
  max?: unknown;
  step?: unknown;
  integer?: unknown;
  label?: unknown;
}

export interface FoundrySettingsGlobals {
  game: FoundrySettingsGame;
  foundry: {
    data: {
      fields: FoundryFieldClasses;
      validation?: { DataModelValidationError?: FoundryClass; DataModelValidationFailure?: FoundryClass } | undefined;
    };
    abstract: { DataModel: FoundryClass };
  };
}

export type SettingGlobalsProvider = () => FoundrySettingsGlobals;
