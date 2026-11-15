import {
  DocumentHasNoOwnershipError,
  DocumentNotFoundError,
  OwnershipUserNotFoundError,
  applyOwnershipChanges,
  requireOwnershipChanges,
  requireWorldDocument,
  type DocumentOwnership,
  type DocumentOwnershipStore,
  type DocumentReference,
  type OwnershipLevels
} from '@/core/documents/domain';
import type { DocumentQuery, SetOwnershipCommand } from './commands';

export interface DocumentOwnershipServiceDependencies {
  readonly documents: DocumentOwnershipStore;
}

interface Owned {
  readonly document: DocumentReference;
  readonly ownership: OwnershipLevels;
}

export class DocumentOwnershipService {
  constructor(private readonly deps: DocumentOwnershipServiceDependencies) {}

  async getOwnership(query: DocumentQuery): Promise<DocumentOwnership> {
    return this.describe(await this.requireOwned(query.uuid));
  }

  async setOwnership(command: SetOwnershipCommand): Promise<DocumentOwnership> {
    requireOwnershipChanges(command.changes);
    const owned = await this.requireOwned(command.uuid);
    requireWorldDocument(owned.document);
    for (const [userId, level] of command.changes.users ?? []) {
      // Removing the entry of a deleted user cleans up; adding one would store a dead entry.
      if (level !== null && this.deps.documents.userName(userId) === null) {
        throw new OwnershipUserNotFoundError(userId);
      }
    }
    const next = applyOwnershipChanges(owned.document, owned.ownership, command.changes);
    const updated = await this.deps.documents.replaceOwnership(command.uuid, next);
    if (updated === null || updated.ownership === null) {
      throw new DocumentNotFoundError(command.uuid);
    }
    return this.describe({ document: updated.document, ownership: updated.ownership });
  }

  private async requireOwned(uuid: string): Promise<Owned> {
    const found = await this.deps.documents.findDocument(uuid);
    if (found === null) {
      throw new DocumentNotFoundError(uuid);
    }
    if (found.ownership === null) {
      throw new DocumentHasNoOwnershipError(found.document.documentType, uuid);
    }
    return { document: found.document, ownership: found.ownership };
  }

  private describe(owned: Owned): DocumentOwnership {
    return {
      document: owned.document,
      defaultLevel: owned.ownership.defaultLevel,
      users: [...owned.ownership.users].map(([userId, level]) => ({
        userId,
        userName: this.deps.documents.userName(userId),
        level
      }))
    };
  }
}
