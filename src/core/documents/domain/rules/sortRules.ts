import {
  DocumentNotSortableError,
  DocumentsNotSiblingsError,
  SortTargetIsSelfError
} from '@/core/documents/domain/errors/documentErrors';
import type { SortableDocument } from '@/core/documents/domain/model/SortableDocument';

/** A document is sorted among its siblings only: same type, same folder or parent document. */
export function requireSortableSiblings(source: SortableDocument, target: SortableDocument): void {
  if (source.document.uuid === target.document.uuid) {
    throw new SortTargetIsSelfError();
  }
  for (const { document, container } of [source, target]) {
    if (container === null) {
      throw new DocumentNotSortableError(document.documentType, document.uuid);
    }
  }
  if (source.document.documentType !== target.document.documentType || source.container !== target.container) {
    throw new DocumentsNotSiblingsError(source.document.uuid, target.document.uuid);
  }
}
