import {
  InheritOwnershipNotAllowedError,
  NoOwnershipChangesError
} from '@/core/documents/domain/errors/documentErrors';
import type {
  OwnershipChanges,
  OwnershipLevel,
  OwnershipLevels
} from '@/core/documents/domain/model/DocumentOwnership';
import { isEmbeddedDocument, type DocumentReference } from '@/core/documents/domain/model/DocumentReference';

export function requireOwnershipChanges(changes: OwnershipChanges): void {
  if (changes.defaultLevel === undefined && (changes.users === undefined || changes.users.size === 0)) {
    throw new NoOwnershipChangesError();
  }
}

/**
 * The ownership after the changes. `inherit` defers to the parent document, so the core offers it for embedded
 * documents only (`DocumentOwnershipConfig`); a primary document would fall through to "none".
 */
export function applyOwnershipChanges(
  document: DocumentReference,
  current: OwnershipLevels,
  changes: OwnershipChanges
): OwnershipLevels {
  const requireLevel = (level: OwnershipLevel): void => {
    if (level === 'inherit' && !isEmbeddedDocument(document)) {
      throw new InheritOwnershipNotAllowedError(document.documentType);
    }
  };

  if (changes.defaultLevel !== undefined) {
    requireLevel(changes.defaultLevel);
  }
  const users = new Map(current.users);
  for (const [userId, level] of changes.users ?? []) {
    if (level === null) {
      users.delete(userId);
    } else {
      requireLevel(level);
      users.set(userId, level);
    }
  }
  return { defaultLevel: changes.defaultLevel ?? current.defaultLevel, users };
}
