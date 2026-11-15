export interface WorldFolderRef {
  readonly id: string;
  readonly name: string;
  readonly type: string;
}

export interface WorldDocumentRef {
  readonly id: string;
  readonly name: string;
}

export interface PackImportOptions {
  readonly folderId?: string | undefined;
  readonly folderName?: string | undefined;
  readonly keepId: boolean;
  /** Pack documents left out of the import (script macros without the opt-in); absent: everything. */
  readonly skipDocumentIds?: readonly string[] | undefined;
}

export interface PackImportOutcome {
  readonly folder: WorldDocumentRef | null;
  readonly documents: readonly WorldDocumentRef[];
  /** Script macros left in the pack; present only when the import ran without the script opt-in. */
  readonly skippedScriptMacros?: readonly WorldDocumentRef[] | undefined;
}

export interface PackFolderImportPlan {
  /** The pack folder first, then its descendants (parents before children). */
  readonly folderIds: readonly string[];
  readonly documentIds: readonly string[];
  readonly parentFolderId: string | null;
  readonly keepId: boolean;
}

export interface PackFolderImportOutcome {
  readonly folder: WorldDocumentRef;
  readonly createdFolderCount: number;
  readonly documents: readonly WorldDocumentRef[];
  /** Script macros left in the pack; present only when the import ran without the script opt-in. */
  readonly skippedScriptMacros?: readonly WorldDocumentRef[] | undefined;
}

export interface PackDocumentPlacement {
  readonly id: string;
  readonly folderId: string | null;
}
