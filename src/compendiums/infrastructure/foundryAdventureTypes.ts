import type { FoundryCreatedWorldDocument } from './foundryPackManagementTypes';

// Structural types for the core Adventure document (client/documents/adventure.mjs),
// identical in the v13.351 and v14.368 clients except for v14's `importedTime`.

export interface FoundryAdventureContentClass {
  documentName: string;
}

export interface FoundryAdventureClass {
  /** Content field name (`actors`, `journal`, …) → the embedded document class. */
  contentFields: Record<string, FoundryAdventureContentClass>;
  prototype: { prepareImport?: unknown; import?: unknown };
}

export interface FoundryAdventureSource {
  _id?: string | null;
  name?: string | null;
  /** A Macro's `script` / `chat`. */
  type?: string | null;
}

export interface FoundryAdventureImportData {
  toCreate: Record<string, FoundryAdventureSource[] | undefined>;
  toUpdate: Record<string, FoundryAdventureSource[] | undefined>;
  documentCount: number;
}

export interface FoundryAdventureImportResult {
  /** Arrays when the import was cancelled (`preImportAdventure` returned false). */
  created: Record<string, FoundryCreatedWorldDocument[] | undefined> | unknown[];
  updated: Record<string, FoundryCreatedWorldDocument[] | undefined> | unknown[];
}

export type FoundryAdventurePreImport = (importData: FoundryAdventureImportData) => void | Promise<void>;

export interface FoundryAdventureDocument {
  id: string;
  uuid: string;
  name: string;
  img?: string | null | undefined;
  caption?: string | null | undefined;
  description?: string | null | undefined;
  prepareImport(options: { importFields: string[] }): Promise<FoundryAdventureImportData>;
  import(options: {
    dialog: boolean;
    importFields: string[];
    preImport: FoundryAdventurePreImport[];
  }): Promise<FoundryAdventureImportResult>;
}
