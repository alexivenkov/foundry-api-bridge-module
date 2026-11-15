import type {
  FolderExportOptions,
  FolderExportOutcome,
  PackDocumentChanges,
  PackDocumentRef,
  WorldDocumentExport
} from '@/compendiums/domain/model';

// Writes into a pack. Callers check that the pack exists and is unlocked;
// the core refuses every write into a locked pack as well.
export interface PackContentWriter {
  findDocument(packId: string, documentId: string): Promise<PackDocumentRef | null>;

  /** The stored data of a pack document; null when it is gone. */
  readDocumentSource?(packId: string, documentId: string): Promise<Readonly<Record<string, unknown>> | null>;

  /** Copies a world document of the pack's type into the pack as a new document; null when the core created nothing. */
  exportWorldDocument(packId: string, request: WorldDocumentExport): Promise<PackDocumentRef | null>;

  /** Null when the core refused the folder tree. */
  exportWorldFolder(
    packId: string,
    folderId: string,
    options: FolderExportOptions
  ): Promise<FolderExportOutcome | null>;

  updateDocument(packId: string, documentId: string, changes: PackDocumentChanges): Promise<PackDocumentRef>;

  deleteDocument(packId: string, documentId: string): Promise<void>;
}
