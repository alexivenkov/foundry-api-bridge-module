import type { DocumentOwnershipStore, OwnedDocument, OwnershipLevels } from '@/core/documents/domain';
import { toDocumentReference } from './documentMapper';
import { FoundryDocumentResolver } from './FoundryDocumentResolver';
import type { DocumentGlobalsProvider, FoundryDocument } from './foundryDocumentTypes';
import { readOwnership, toFoundryOwnership } from './ownershipCodes';

function toOwnedDocument(document: FoundryDocument): OwnedDocument {
  return {
    document: toDocumentReference(document),
    ownership: document.schema.has('ownership') ? readOwnership(document._source['ownership']) : null
  };
}

/** Anti-corruption layer over the `ownership` field any document type may have. */
export class FoundryDocumentOwnershipStore implements DocumentOwnershipStore {
  private readonly resolver: FoundryDocumentResolver;

  constructor(private readonly globals: DocumentGlobalsProvider) {
    this.resolver = new FoundryDocumentResolver(globals);
  }

  async findDocument(uuid: string): Promise<OwnedDocument | null> {
    const document = await this.resolver.resolve(uuid);
    return document !== null ? toOwnedDocument(document) : null;
  }

  userName(userId: string): string | null {
    return this.globals().game.users.get(userId)?.name ?? null;
  }

  async replaceOwnership(uuid: string, ownership: OwnershipLevels): Promise<OwnedDocument | null> {
    const document = await this.resolver.resolve(uuid);
    if (document === null) {
      return null;
    }
    // A merge cannot drop a user entry: Foundry 14 rejects `-=id` keys and ForcedDeletion inside ownership. Replacing
    // the whole field (non-recursive, undiffed update) needs no operator and works on 13 and 14 alike.
    await document.update({ ownership: toFoundryOwnership(ownership) }, { diff: false, recursive: false });
    return toOwnedDocument(document);
  }
}
