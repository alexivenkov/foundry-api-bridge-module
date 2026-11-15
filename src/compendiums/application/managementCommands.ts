import type {
  AdventureContent,
  AdventureDocumentGroup,
  AdventureHeader,
  PackDocumentRef,
  PackOwnership,
  WorldDocumentRef
} from '@/compendiums/domain';

export interface CreatePackCommand {
  readonly label: string;
  readonly documentType: string;
  readonly folderId?: string | undefined;
}

export interface DuplicatePackCommand {
  readonly packId: string;
  readonly label?: string | undefined;
  readonly folderId?: string | undefined;
}

export interface ConfigurePackCommand {
  readonly packId: string;
  readonly locked?: boolean | undefined;
  readonly ownership?: Partial<PackOwnership> | null | undefined;
  readonly folderId?: string | null | undefined;
}

export interface DeletedPack {
  readonly packId: string;
  readonly label: string;
  readonly documentCount: number;
}

export interface ExportDocumentCommand {
  readonly packId: string;
  readonly documentId: string;
  readonly name?: string | undefined;
  readonly folderId?: string | undefined;
}

export interface ExportedDocument {
  readonly packId: string;
  readonly sourceId: string;
  readonly document: PackDocumentRef;
}

export interface ExportFolderCommand {
  readonly packId: string;
  readonly folderId: string;
  readonly packFolderId?: string | undefined;
  readonly keepFolders: boolean;
  readonly updateByName: boolean;
  readonly keepId: boolean;
}

export interface UpdatePackDocumentCommand {
  readonly packId: string;
  readonly documentId: string;
  readonly name?: string | undefined;
  readonly folderId?: string | null | undefined;
  readonly changes?: Readonly<Record<string, unknown>> | undefined;
}

export interface DeletePackDocumentCommand {
  readonly packId: string;
  readonly documentId: string;
}

export interface DeletedPackDocument {
  readonly packId: string;
  readonly documentId: string;
  readonly name: string;
}

export interface ImportPackCommand {
  readonly packId: string;
  readonly folderId?: string | undefined;
  readonly folderName?: string | undefined;
  readonly keepId: boolean;
}

export interface ImportPackFolderCommand {
  readonly packId: string;
  readonly packFolderId: string;
  readonly folderId?: string | undefined;
  readonly keepId: boolean;
}

export interface GetAdventureQuery {
  readonly packId: string;
  readonly adventureId: string;
}

export interface AdventureDetails extends AdventureHeader {
  readonly packId: string;
  readonly contents: readonly AdventureContent[];
  readonly totalCount: number;
  readonly existingCount: number;
}

export interface ImportAdventureCommand {
  readonly packId: string;
  readonly adventureId: string;
  readonly documentTypes?: readonly string[] | undefined;
  readonly overwrite: boolean;
}

export interface ImportedAdventure {
  readonly packId: string;
  readonly adventureId: string;
  readonly name: string;
  readonly created: readonly AdventureDocumentGroup[];
  readonly updated: readonly AdventureDocumentGroup[];
  /** Script macros left in the adventure; present only when it brought macros in without the script opt-in. */
  readonly skippedScriptMacros?: readonly WorldDocumentRef[] | undefined;
}

