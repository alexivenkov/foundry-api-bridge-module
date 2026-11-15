export interface PackDocumentRef {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly type: string | null;
  readonly img: string | null;
  readonly folderId: string | null;
}

export interface WorldDocumentExport {
  readonly documentId: string;
  readonly name?: string | undefined;
  readonly folderId?: string | undefined;
}

export interface PackDocumentChanges {
  readonly name?: string | undefined;
  readonly folderId?: string | null | undefined;
  readonly changes?: Readonly<Record<string, unknown>> | undefined;
}

export interface FolderExportOptions {
  readonly packFolderId?: string | undefined;
  readonly keepFolders: boolean;
  readonly updateByName: boolean;
  readonly keepId: boolean;
}

export interface FolderExportOutcome {
  readonly exportedCount: number;
  readonly createdCount: number;
  readonly updatedCount: number;
  readonly documentCount: number;
}
