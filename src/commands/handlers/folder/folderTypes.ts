import type { FolderSummary, FolderDocumentType } from '@/commands/types';

export interface FoundryFolderDoc {
  id: string;
  name: string;
  type: string;
  color: string | null | undefined;
  description: string | null | undefined;
  sort: number;
  folder: { id: string } | null | undefined;
  contents: ReadonlyArray<{ id: string }>;
  children: ReadonlyArray<FoundryFolderDoc>;
  getSubfolders(recursive?: boolean): FoundryFolderDoc[];
  update(data: Record<string, unknown>): Promise<FoundryFolderDoc>;
  delete(options?: { deleteSubfolders?: boolean; deleteContents?: boolean }): Promise<FoundryFolderDoc>;
}

export interface FoundryFoldersCollection {
  contents: ReadonlyArray<FoundryFolderDoc>;
  get(id: string): FoundryFolderDoc | undefined;
}

export interface FoundryGame {
  folders: FoundryFoldersCollection;
}

export interface FoundryFolderConstructor {
  create(data: Record<string, unknown>): Promise<FoundryFolderDoc>;
}

export function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

export function getFolderClass(): FoundryFolderConstructor {
  return (globalThis as unknown as { Folder: FoundryFolderConstructor }).Folder;
}

export function mapFolderToSummary(folder: FoundryFolderDoc): FolderSummary {
  return {
    id: folder.id,
    name: folder.name,
    type: folder.type as FolderDocumentType,
    color: folder.color ?? null,
    description: folder.description ?? null,
    parentId: folder.folder?.id ?? null,
    sort: folder.sort
  };
}
