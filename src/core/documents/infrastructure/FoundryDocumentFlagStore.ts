import type { DocumentFlagStore, FlaggedDocument } from '@/core/documents/domain';
import { toDocumentReference, toPlainRecord } from './documentMapper';
import { FoundryDocumentResolver } from './FoundryDocumentResolver';
import { databaseBackendOf, type DocumentGlobalsProvider, type FoundryDocument } from './foundryDocumentTypes';

function toFlaggedDocument(document: FoundryDocument): FlaggedDocument {
  return {
    document: toDocumentReference(document),
    flags: document.schema.has('flags') ? toPlainRecord(document._source['flags']) : null
  };
}

/**
 * Anti-corruption layer over `Document#setFlag` / `#unsetFlag`. The core writes a nested update on Foundry 13
 * (`flags.<scope>.<path>.-=<key>` for an unset) and a ForcedDeletion on 14; going through its own methods keeps that.
 */
export class FoundryDocumentFlagStore implements DocumentFlagStore {
  private readonly resolver: FoundryDocumentResolver;

  constructor(private readonly globals: DocumentGlobalsProvider) {
    this.resolver = new FoundryDocumentResolver(globals);
  }

  async findDocument(uuid: string): Promise<FlaggedDocument | null> {
    const document = await this.resolver.resolve(uuid);
    return document !== null ? toFlaggedDocument(document) : null;
  }

  activeScopes(): readonly string[] {
    return databaseBackendOf(this.globals())?.getFlagScopes() ?? [];
  }

  async setFlag(uuid: string, scope: string, key: string, value: unknown): Promise<FlaggedDocument | null> {
    const document = await this.resolver.resolve(uuid);
    if (document === null) {
      return null;
    }
    await document.setFlag(scope, key, value);
    return toFlaggedDocument(document);
  }

  async unsetFlag(uuid: string, scope: string, key: string): Promise<FlaggedDocument | null> {
    const document = await this.resolver.resolve(uuid);
    if (document === null) {
      return null;
    }
    await document.unsetFlag(scope, key);
    return toFlaggedDocument(document);
  }
}
