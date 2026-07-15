export interface FoundryFolderDocument {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly parent: FoundryFolderDocument | null;
  getSubfolders(recursive: boolean): FoundryFolderDocument[];
}

export interface FoundryFoldersCollection {
  get(id: string): FoundryFolderDocument | undefined;
  contents: readonly FoundryFolderDocument[];
}

export interface FoundryFolderGameProvider {
  getGame(): {
    folders: FoundryFoldersCollection;
  };
}
