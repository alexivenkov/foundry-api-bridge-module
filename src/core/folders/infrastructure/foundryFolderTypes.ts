export interface FoundryFolderDocument {
  id: string;
  name: string;
  type: string;
  color: string | null | undefined;
  description: string | null | undefined;
  sort: number;
  folder: { id: string } | null | undefined;
  contents: ReadonlyArray<{ id: string }>;
  /** Filled by the core when it builds the sidebar tree; unset on a folder the tree never reached. */
  children: ReadonlyArray<FoundryFolderTreeNode | FoundryFolderDocument> | undefined;
  getSubfolders(recursive?: boolean): FoundryFolderDocument[];
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(options?: { deleteSubfolders?: boolean; deleteContents?: boolean }): Promise<unknown>;
}

/**
 * A node of the sidebar tree (`FolderChildNode`). This is what `Folder#children`
 * holds, not the child folders themselves — verified against Foundry 13.351
 * and 14.368.
 */
export interface FoundryFolderTreeNode {
  folder: FoundryFolderDocument;
  children: ReadonlyArray<FoundryFolderTreeNode>;
  entries: ReadonlyArray<unknown>;
}

export interface FoundryFoldersCollection {
  contents: ReadonlyArray<FoundryFolderDocument>;
  get(id: string): FoundryFolderDocument | undefined;
}

export interface FoundryFolderClass {
  create(data: Record<string, unknown>): Promise<FoundryFolderDocument | undefined>;
}

/** The globals the context reaches for: the world collection, and the document class that creates folders. */
export interface FoundryFolderGlobals {
  game: { folders: FoundryFoldersCollection };
  Folder: FoundryFolderClass;
}
