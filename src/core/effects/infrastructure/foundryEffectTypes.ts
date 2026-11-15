import type { FoundryActorsGame } from '@/core/shared';

/** Foundry 13 stores a change value as a string; Foundry 14 stores any JSON value. */
export interface FoundryEffectChange {
  key: string;
  value: unknown;
  mode: number;
}

/**
 * Up to Foundry 13 a duration carries `seconds` / `rounds` / `turns`: nullable
 * numbers, `undefined` until set and `null` once the effect sheet saved them
 * empty. From 14 it is one `value` in `units`, and `seconds` is derived by the
 * core for every effect.
 */
export interface FoundryEffectDuration {
  seconds?: number | null;
  rounds?: number | null;
  turns?: number | null;
  value?: number | null;
  units?: string;
}

/** A change as stored: `{ key, value, mode, priority }` up to 13, `{ key, type, value, phase, priority }` from 14. */
export interface FoundryEffectSourceChange {
  key?: string;
  value?: unknown;
  mode?: number;
  type?: string;
  phase?: string;
  priority?: number | null;
}

/** A stored duration: the Foundry 13 fields, or the Foundry 14 `value` / `units` / `expiry` / `expired`. */
export interface FoundryEffectSourceDuration {
  seconds?: number | null;
  rounds?: number | null;
  turns?: number | null;
  value?: number | null;
  units?: string;
  expiry?: string | null;
  expired?: boolean;
}

/**
 * The stored data of an ActiveEffect (`BaseActiveEffect` schema). Foundry 13
 * keeps `changes` at the top level; Foundry 14 keeps them in `system.changes`
 * and adds `showIcon` (0 never, 1 conditional, 2 always).
 */
export interface FoundryEffectSource {
  _id: string;
  name: string;
  img?: string | null;
  type?: string;
  system?: Record<string, unknown>;
  changes?: FoundryEffectSourceChange[];
  disabled?: boolean;
  duration?: FoundryEffectSourceDuration;
  description?: string | null;
  origin?: string | null;
  tint?: string;
  transfer?: boolean;
  statuses?: string[];
  showIcon?: number;
  sort?: number;
}

/** The ActiveEffect fields and methods the summary commands use (`BaseActiveEffect` schema, Foundry 13–14). */
export interface FoundryActiveEffect {
  _id: string;
  name: string;
  /** A nullable file path in the schema. */
  img: string | null | undefined;
  disabled: boolean;
  origin: string | null;
  statuses: Set<string>;
  changes: FoundryEffectChange[];
  duration: FoundryEffectDuration;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
}

export interface FoundryEffectsCollection {
  contents: FoundryActiveEffect[];
  get(id: string): FoundryActiveEffect | undefined;
}

export interface FoundryStatusToggleOptions {
  active?: boolean;
  overlay?: boolean;
}

/**
 * `Actor#toggleStatusEffect` resolves to the effect it created, `true` when the
 * status was already there, `false` when it removed it, and `undefined` when
 * there was nothing to change.
 */
export type FoundryStatusToggleResult = Pick<FoundryActiveEffect, '_id'> | boolean | undefined;

export interface FoundryEffectActor {
  id: string;
  name: string;
  effects: FoundryEffectsCollection;
  statuses: Set<string>;
  toggleStatusEffect(statusId: string, options?: FoundryStatusToggleOptions): Promise<FoundryStatusToggleResult>;
  createEmbeddedDocuments(
    type: 'ActiveEffect',
    data: Record<string, unknown>[]
  ): Promise<Pick<FoundryActiveEffect, '_id' | 'name'>[] | null>;
}

export type FoundryEffectGame = FoundryActorsGame<FoundryEffectActor>;

/** An ActiveEffect read through its stored data: colors as strings, statuses as an array, the duration unprepared. */
export interface FoundryStoredEffect {
  _source: FoundryEffectSource;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
}

/** An Actor or an Item: a document with embedded ActiveEffects. */
export interface FoundryEffectParent {
  effects: {
    contents: FoundryStoredEffect[];
    get(id: string): FoundryStoredEffect | undefined;
  };
  /** Resolves to the documents created; none when a `preCreate` hook vetoed it. */
  createEmbeddedDocuments(type: 'ActiveEffect', data: Record<string, unknown>[]): Promise<FoundryStoredEffect[] | null>;
}

export interface FoundryEffectItem extends FoundryEffectParent {
  id: string;
  name: string;
}

export interface FoundryEffectOwnerActor extends FoundryEffectParent {
  id: string;
  name: string;
  items: { get(id: string): FoundryEffectItem | undefined };
}

export type FoundryEffectDocumentGame = FoundryActorsGame<FoundryEffectOwnerActor> & {
  items: { get(id: string): FoundryEffectItem | undefined } | undefined;
  /** The subtypes the world registers per document (Foundry 11+). */
  documentTypes?: Readonly<Record<string, readonly string[]>>;
};

/** The game both effect services read: the real `game` is both. */
export type FoundryEffectsGame = FoundryEffectGame & FoundryEffectDocumentGame;

/** What a field's `validate` hands back: nothing when the value is valid. */
export interface FoundryValidationFailure {
  message?: string;
}

/** The globals the effect registries are read from (Foundry 13–14 `CONST` / `CONFIG`). */
export interface FoundryEffectGlobals {
  CONST?: {
    /** Foundry 14: change type → default priority. */
    ACTIVE_EFFECT_CHANGE_TYPES?: Readonly<Record<string, number>>;
    /** Foundry 14. */
    ACTIVE_EFFECT_CHANGE_PHASES?: readonly string[];
    /** Foundry 14. */
    ACTIVE_EFFECT_EXPIRY_EVENTS?: readonly string[];
  };
  CONFIG?: {
    ActiveEffect?: {
      /** Foundry 14: change types registered by packages. */
      changeTypes?: Readonly<Record<string, unknown>>;
      /** Foundry 14: change phases registered by packages. */
      phases?: Readonly<Record<string, unknown>>;
      /** Foundry 14: expiry events registered by packages. */
      expiryEvents?: Readonly<Record<string, unknown>>;
      documentClass?: {
        schema?: {
          fields?: { origin?: { validate(value: unknown): FoundryValidationFailure | undefined } };
        };
      };
    };
  };
}
