import type { WorldDocumentRef, WorldFolderRef } from '@/compendiums/domain/model';

export interface WorldDirectory {
  findFolder(folderId: string): WorldFolderRef | null;

  findDocument(documentType: string, documentId: string): WorldDocumentRef | null;

  /** The ids among `documentIds` that a world document of this type already uses. */
  existingDocumentIds(documentType: string, documentIds: readonly string[]): readonly string[];
}
