import {
  FolderCreationCancelledError,
  FolderNotFoundError,
  type Folder,
  type FolderChanges,
  type FolderDeletionOptions,
  type FolderDraft,
  type FolderStore,
  type FolderTree,
  type FolderTreeOptions
} from '../../domain';
import { FolderService } from '../FolderService';

function folder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: 'heroes',
    name: 'Heroes',
    type: 'Actor',
    color: null,
    description: null,
    parentId: null,
    sort: 0,
    ...overrides
  };
}

class FakeFolderStore implements FolderStore {
  readonly trees: Array<{ folderId: string; options: FolderTreeOptions }> = [];
  readonly created: FolderDraft[] = [];
  readonly updated: Array<{ folderId: string; changes: FolderChanges }> = [];
  readonly deleted: Array<{ folderId: string; options: FolderDeletionOptions }> = [];
  createsNothing = false;
  losesFolderOnUpdate = false;

  constructor(private readonly folders: readonly Folder[]) {}

  listFolders(): readonly Folder[] {
    return this.folders;
  }

  findFolder(folderId: string): Folder | null {
    return this.folders.find((candidate) => candidate.id === folderId) ?? null;
  }

  readTree(folderId: string, options: FolderTreeOptions): FolderTree | null {
    this.trees.push({ folderId, options });
    const found = this.findFolder(folderId);
    return found !== null ? { ...found, subfolders: [] } : null;
  }

  createFolder(draft: FolderDraft): Promise<Folder | null> {
    this.created.push(draft);
    return Promise.resolve(this.createsNothing ? null : folder({ id: 'created', name: draft.name, type: draft.type }));
  }

  updateFolder(folderId: string, changes: FolderChanges): Promise<Folder | null> {
    this.updated.push({ folderId, changes });
    const current = this.findFolder(folderId);
    if (current === null || this.losesFolderOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...current, ...(changes.name !== undefined ? { name: changes.name } : {}) });
  }

  deleteFolder(folderId: string, options: FolderDeletionOptions): Promise<void> {
    this.deleted.push({ folderId, options });
    return Promise.resolve();
  }
}

function setup(): { service: FolderService; store: FakeFolderStore } {
  const store = new FakeFolderStore([
    folder(),
    folder({ id: 'villains', name: 'Villains' }),
    folder({ id: 'loot', name: 'Loot', type: 'Item' })
  ]);
  return { service: new FolderService({ folders: store }), store };
}

describe('FolderService', () => {
  describe('listFolders', () => {
    it('lists the folders of every document type when none is named', () => {
      const folders = setup().service.listFolders({ type: undefined });

      expect(folders.map((entry) => entry.id)).toEqual(['heroes', 'villains', 'loot']);
    });

    it('keeps only the folders of the named document type', () => {
      const folders = setup().service.listFolders({ type: 'Actor' });

      expect(folders.map((entry) => entry.id)).toEqual(['heroes', 'villains']);
    });

    it('lists nothing for a type no folder has', () => {
      expect(setup().service.listFolders({ type: 'Playlist' })).toEqual([]);
      expect(setup().service.listFolders({ type: 'actor' })).toEqual([]);
    });
  });

  describe('getFolder', () => {
    it('reads the tree with the options it was asked for', () => {
      const { service, store } = setup();
      const tree = { includeSubfolders: false, includeContents: true };

      const found = service.getFolder({ folderId: 'loot', tree });

      expect(store.trees).toEqual([{ folderId: 'loot', options: tree }]);
      expect(found).toMatchObject({ id: 'loot', subfolders: [] });
    });

    it('rejects an unknown folder', () => {
      const act = (): unknown =>
        setup().service.getFolder({ folderId: 'missing', tree: { includeSubfolders: true, includeContents: false } });

      expect(act).toThrow(FolderNotFoundError);
      expect(act).toThrow('Folder not found: missing');
    });
  });

  describe('createFolder', () => {
    const draft: FolderDraft = { name: 'Maps', type: 'Scene', parentId: 'atlas' };

    it('hands the draft to the store and returns the created folder', async () => {
      const { service, store } = setup();

      const created = await service.createFolder({ draft });

      expect(store.created).toEqual([draft]);
      expect(created).toMatchObject({ id: 'created', name: 'Maps', type: 'Scene' });
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      const creation = service.createFolder({ draft });

      await expect(creation).rejects.toThrow(FolderCreationCancelledError);
      await expect(creation).rejects.toThrow(
        'Folder creation was cancelled by Foundry (a module hook may have vetoed it)'
      );
    });
  });

  describe('updateFolder', () => {
    it('applies the changes to an existing folder', async () => {
      const { service, store } = setup();

      const updated = await service.updateFolder({ folderId: 'loot', changes: { name: 'Treasure', parentId: null } });

      expect(store.updated).toEqual([{ folderId: 'loot', changes: { name: 'Treasure', parentId: null } }]);
      expect(updated.name).toBe('Treasure');
    });

    it('rejects an unknown folder without touching the store', async () => {
      const { service, store } = setup();

      await expect(service.updateFolder({ folderId: 'missing', changes: {} }))
        .rejects.toThrow('Folder not found: missing');
      expect(store.updated).toEqual([]);
    });

    it('reports the folder as missing when it vanished during the update', async () => {
      const { service, store } = setup();
      store.losesFolderOnUpdate = true;

      await expect(service.updateFolder({ folderId: 'loot', changes: {} })).rejects.toThrow(FolderNotFoundError);
    });
  });

  describe('deleteFolder', () => {
    it('deletes an existing folder with the choices made for what it holds', async () => {
      const { service, store } = setup();
      const options = { deleteSubfolders: true, deleteContents: false };

      await service.deleteFolder({ folderId: 'villains', options });

      expect(store.deleted).toEqual([{ folderId: 'villains', options }]);
    });

    it('rejects an unknown folder without deleting anything', async () => {
      const { service, store } = setup();

      await expect(service.deleteFolder({ folderId: 'missing', options: {} })).rejects.toThrow(FolderNotFoundError);
      expect(store.deleted).toEqual([]);
    });
  });
});
