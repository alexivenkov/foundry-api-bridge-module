import type { WorldDocumentRef } from './worldDirectory';

export interface AdventureHeader {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly img: string | null;
  readonly caption: string;
  readonly description: string;
  readonly imported: boolean;
}

export interface AdventureDocumentGroup {
  readonly documentType: string;
  readonly documents: readonly WorldDocumentRef[];
}

// What the core's `Adventure#prepareImport` decided: documents whose id is
// free in the world are created, the others replace the world document.
export interface AdventureImportPlan {
  readonly toCreate: readonly AdventureDocumentGroup[];
  readonly toUpdate: readonly AdventureDocumentGroup[];
  /** The script macros among the planned Macro documents; absent when there are none. */
  readonly scriptMacros?: readonly WorldDocumentRef[] | undefined;
}

export interface AdventureImportOutcome {
  readonly created: readonly AdventureDocumentGroup[];
  readonly updated: readonly AdventureDocumentGroup[];
  /** The script macros the import left out; present only when it was asked to skip them. */
  readonly skippedScriptMacros?: readonly WorldDocumentRef[] | undefined;
}

export interface AdventureEntry {
  readonly id: string;
  readonly name: string;
  readonly existsInWorld: boolean;
}

export interface AdventureContent {
  readonly documentType: string;
  readonly entries: readonly AdventureEntry[];
}

export interface AdventureImportRequest {
  readonly documentTypes?: readonly string[] | undefined;
  readonly allowOverwrite: boolean;
  /** Leave the adventure's script macros out (no script opt-in). */
  readonly skipScriptMacros?: boolean | undefined;
}
