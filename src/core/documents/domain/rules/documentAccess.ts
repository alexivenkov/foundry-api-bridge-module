import { CompendiumDocumentReadOnlyError } from '@/core/documents/domain/errors/documentErrors';
import { isCompendiumDocument, type DocumentReference } from '@/core/documents/domain/model/DocumentReference';

/** Writes reach world documents only: a compendium is changed through the compendium commands. */
export function requireWorldDocument(document: DocumentReference): void {
  if (isCompendiumDocument(document)) {
    throw new CompendiumDocumentReadOnlyError(document.uuid);
  }
}
