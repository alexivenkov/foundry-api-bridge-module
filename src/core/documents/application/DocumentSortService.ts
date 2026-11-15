import {
  DocumentNotFoundError,
  requireSortableSiblings,
  requireWorldDocument,
  type DocumentSortResult,
  type DocumentSortStore,
  type SortableDocument
} from '@/core/documents/domain';
import type { SortDocumentCommand } from './commands';

export interface DocumentSortServiceDependencies {
  readonly documents: DocumentSortStore;
}

export class DocumentSortService {
  constructor(private readonly deps: DocumentSortServiceDependencies) {}

  async sortDocument(command: SortDocumentCommand): Promise<DocumentSortResult> {
    const source = await this.requireDocument(command.uuid);
    const target = await this.requireDocument(command.targetUuid);
    requireWorldDocument(source.document);
    requireWorldDocument(target.document);
    requireSortableSiblings(source, target);

    const sorted = await this.deps.documents.sortRelative(command.uuid, command.targetUuid, command.position);
    if (sorted === null) {
      throw new DocumentNotFoundError(command.uuid);
    }
    return {
      document: sorted.document,
      sort: sorted.sort,
      targetUuid: target.document.uuid,
      position: command.position
    };
  }

  private async requireDocument(uuid: string): Promise<SortableDocument> {
    const found = await this.deps.documents.findDocument(uuid);
    if (found === null) {
      throw new DocumentNotFoundError(uuid);
    }
    return found;
  }
}
