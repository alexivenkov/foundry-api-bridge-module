/** A directory folder. Each folder holds documents of one type, named by `type` (`Actor`, `Item`, …). */
export interface Folder {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly color: string | null;
  readonly description: string | null;
  readonly parentId: string | null;
  readonly sort: number;
}

export interface FolderTree extends Folder {
  readonly subfolders: readonly FolderTree[];
  /** The documents directly inside the folder; absent when contents were not asked for. */
  readonly contentIds?: readonly string[] | undefined;
}

export interface FolderTreeOptions {
  /** False cuts the tree off at the folder itself. */
  readonly includeSubfolders: boolean;
  readonly includeContents: boolean;
}

/**
 * The attributes a caller may set; an omitted one is left untouched. `null`
 * moves the folder to the root, or clears its color or description.
 */
export interface FolderChanges {
  readonly name?: string | undefined;
  readonly parentId?: string | null | undefined;
  readonly color?: string | null | undefined;
  readonly description?: string | null | undefined;
  readonly sort?: number | undefined;
}

export interface FolderDraft extends FolderChanges {
  readonly name: string;
  readonly type: string;
}

/** Whether the folder takes its subfolders and documents with it; an omitted choice is left to the core, which keeps them. */
export interface FolderDeletionOptions {
  readonly deleteSubfolders?: boolean | undefined;
  readonly deleteContents?: boolean | undefined;
}
