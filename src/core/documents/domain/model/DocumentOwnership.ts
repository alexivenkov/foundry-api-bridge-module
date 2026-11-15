import type { DocumentReference } from './DocumentReference';

export const OWNERSHIP_LEVELS = ['inherit', 'none', 'limited', 'observer', 'owner'] as const;
export type OwnershipLevel = (typeof OWNERSHIP_LEVELS)[number];

export interface UserOwnership {
  readonly userId: string;
  /** Null for an entry of a user who no longer exists. */
  readonly userName: string | null;
  readonly level: OwnershipLevel;
}

/** The ownership a document stores: the default level and the explicit per-user entries. */
export interface OwnershipLevels {
  readonly defaultLevel: OwnershipLevel;
  readonly users: ReadonlyMap<string, OwnershipLevel>;
}

export interface DocumentOwnership {
  readonly document: DocumentReference;
  readonly defaultLevel: OwnershipLevel;
  readonly users: readonly UserOwnership[];
}

/** A document as the ownership commands see it; `ownership` is null for a type without ownership. */
export interface OwnedDocument {
  readonly document: DocumentReference;
  readonly ownership: OwnershipLevels | null;
}

/** Omitted parts are kept. A user mapped to `null` loses the entry and falls back to the default level. */
export interface OwnershipChanges {
  readonly defaultLevel?: OwnershipLevel | undefined;
  readonly users?: ReadonlyMap<string, OwnershipLevel | null> | undefined;
}
