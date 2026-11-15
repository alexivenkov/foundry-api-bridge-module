import type { DocumentReference } from './DocumentReference';

/** A document as the flag commands see it; `flags` is null for a type without flags. */
export interface FlaggedDocument {
  readonly document: DocumentReference;
  /** Every scope, keyed by scope name, as plain JSON. */
  readonly flags: Readonly<Record<string, unknown>> | null;
}

export interface DocumentFlags {
  readonly document: DocumentReference;
  readonly scope: string | null;
  readonly flags: Readonly<Record<string, unknown>>;
}

export interface DocumentFlagValue {
  readonly document: DocumentReference;
  readonly scope: string;
  readonly key: string;
  readonly value: unknown;
}

export interface DocumentFlagRemoval {
  readonly document: DocumentReference;
  readonly scope: string;
  readonly key: string;
  readonly existed: boolean;
}
