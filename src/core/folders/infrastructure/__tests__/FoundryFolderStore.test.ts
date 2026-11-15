import { FoundryFolderStore } from '../FoundryFolderStore';
import type { FoundryFolderDocument, FoundryFolderGlobals, FoundryFolderTreeNode } from '../foundryFolderTypes';

function document(overrides: Partial<FoundryFolderDocument> = {}): FoundryFolderDocument {
  const doc: FoundryFolderDocument = {
    id: 'heroes',
    name: 'Heroes',
    type: 'Actor',
    color: '#ff0000',
    description: 'Player characters',
    sort: 100,
    folder: { id: 'party' },
    contents: [],
    children: [],
    getSubfolders: jest.fn(() => []),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
  (doc.update as jest.Mock).mockImplementation((data: { name?: string; folder?: string | null }) => {
    if (data.name !== undefined) {
      doc.name = data.name;
    }
    if (data.folder !== undefined) {
      doc.folder = data.folder === null ? null : { id: data.folder };
    }
    return Promise.resolve(doc);
  });
  return doc;
}

function storeFor(documents: FoundryFolderDocument[], create: jest.Mock = jest.fn()): FoundryFolderStore {
  const globals: FoundryFolderGlobals = {
    game: { folders: { contents: documents, get: (id) => documents.find((doc) => doc.id === id) } },
    Folder: { create }
  };
  return new FoundryFolderStore(() => globals);
}

const WHOLE_TREE = { includeSubfolders: true, includeContents: false };

describe('FoundryFolderStore', () => {
  describe('reading', () => {
    it('maps a folder, taking the parent from the folder field', () => {
      expect(storeFor([document()]).listFolders()).toEqual([
        {
          id: 'heroes',
          name: 'Heroes',
          type: 'Actor',
          color: '#ff0000',
          description: 'Player characters',
          parentId: 'party',
          sort: 100
        }
      ]);
    });

    it('reads a missing color, description and parent as null', () => {
      const doc = document({ color: undefined, description: undefined, folder: undefined });

      expect(storeFor([doc]).findFolder('heroes')).toMatchObject({ color: null, description: null, parentId: null });
    });

    it('lists the folders in the order of the collection', () => {
      const store = storeFor([document({ id: 'b' }), document({ id: 'a', type: 'Item' })]);

      expect(store.listFolders().map((folder) => folder.id)).toEqual(['b', 'a']);
    });

    it('returns null for an unknown folder', () => {
      const store = storeFor([document()]);

      expect(store.findFolder('missing')).toBeNull();
      expect(store.readTree('missing', WHOLE_TREE)).toBeNull();
    });
  });

  describe('readTree', () => {
    // The shape Foundry 13.351 and 14.368 really have: `children` holds the nodes
    // of the sidebar tree, each wrapping a subfolder and carrying its own children.
    function treeNode(folder: FoundryFolderDocument, children: FoundryFolderTreeNode[] = []): FoundryFolderTreeNode {
      const node = { root: false, folder, depth: 1, visible: true, children, entries: [...folder.contents] };
      folder.children = children;
      return node;
    }

    function world(): FoundryFolderDocument {
      const npcs = document({
        id: 'npcs',
        name: 'NPCs',
        color: null,
        description: null,
        sort: 5,
        folder: { id: 'allies' },
        contents: [{ id: 'actor-3' }]
      });
      const allies = document({ id: 'allies', name: 'Allies', sort: 20, folder: { id: 'heroes' } });
      const rivals = document({ id: 'rivals', name: 'Rivals', folder: { id: 'heroes' }, contents: [{ id: 'actor-4' }] });
      return document({
        folder: null,
        contents: [{ id: 'actor-1' }, { id: 'actor-2' }],
        children: [treeNode(allies, [treeNode(npcs)]), treeNode(rivals)]
      });
    }

    it('reads each subfolder from the tree node that wraps it', () => {
      const tree = storeFor([world()]).readTree('heroes', WHOLE_TREE);

      expect(tree?.subfolders.map((sub) => sub.id)).toEqual(['allies', 'rivals']);
      expect(tree?.subfolders[0]).toEqual({
        id: 'allies',
        name: 'Allies',
        type: 'Actor',
        color: '#ff0000',
        description: 'Player characters',
        parentId: 'heroes',
        sort: 20,
        subfolders: [
          {
            id: 'npcs',
            name: 'NPCs',
            type: 'Actor',
            color: null,
            description: null,
            parentId: 'allies',
            sort: 5,
            subfolders: []
          }
        ]
      });
    });

    it('cuts the tree off at the folder itself when subfolders are not wanted', () => {
      const tree = storeFor([world()]).readTree('heroes', { includeSubfolders: false, includeContents: false });

      expect(tree?.subfolders).toEqual([]);
    });

    it('leaves the contents out unless they are asked for', () => {
      const tree = storeFor([world()]).readTree('heroes', WHOLE_TREE);

      expect(tree).not.toHaveProperty('contentIds');
      expect(tree?.subfolders[0]).not.toHaveProperty('contentIds');
    });

    it('lists the ids of the documents directly inside every folder of the tree', () => {
      const tree = storeFor([world()]).readTree('heroes', { includeSubfolders: true, includeContents: true });

      expect(tree?.contentIds).toEqual(['actor-1', 'actor-2']);
      expect(tree?.subfolders[0]?.contentIds).toEqual([]);
      expect(tree?.subfolders[0]?.subfolders[0]?.contentIds).toEqual(['actor-3']);
      expect(tree?.subfolders[1]?.contentIds).toEqual(['actor-4']);
    });

    it('lists the contents of the folder alone when subfolders are not wanted', () => {
      const tree = storeFor([world()]).readTree('heroes', { includeSubfolders: false, includeContents: true });

      expect(tree).toMatchObject({ subfolders: [], contentIds: ['actor-1', 'actor-2'] });
    });

    it('walks the children a node carries, whatever the wrapped folder says about its own', () => {
      const leaf = document({ id: 'leaf', name: 'Leaf' });
      const middle = document({ id: 'middle', name: 'Middle' });
      const node = treeNode(middle, [treeNode(leaf)]);
      middle.children = undefined;

      const tree = storeFor([document({ children: [node] })]).readTree('heroes', WHOLE_TREE);

      expect(tree?.subfolders[0]?.subfolders.map((sub) => sub.id)).toEqual(['leaf']);
    });

    it('still reads a child that is a folder itself rather than a node', () => {
      const grandchild = document({ id: 'npcs', name: 'NPCs', contents: [{ id: 'actor-3' }] });
      const child = document({ id: 'allies', name: 'Allies', folder: { id: 'heroes' }, children: [grandchild] });
      const parent = document({ children: [child] });

      const tree = storeFor([parent]).readTree('heroes', { includeSubfolders: true, includeContents: true });

      expect(tree?.subfolders[0]).toMatchObject({ id: 'allies', name: 'Allies', parentId: 'heroes' });
      expect(tree?.subfolders[0]?.subfolders[0]).toMatchObject({ id: 'npcs', contentIds: ['actor-3'] });
    });

    it('reads a folder the sidebar tree never reached as one without subfolders', () => {
      const unreached = document({ children: undefined, contents: [{ id: 'actor-1' }] });

      expect(storeFor([unreached]).readTree('heroes', { includeSubfolders: true, includeContents: true }))
        .toMatchObject({ subfolders: [], contentIds: ['actor-1'] });
    });
  });

  describe('createFolder', () => {
    it('creates through the Folder class, writing the parent into the folder field', async () => {
      const create = jest.fn().mockResolvedValue(document({ id: 'new', name: 'Maps', type: 'Scene' }));

      const created = await storeFor([], create).createFolder({
        name: 'Maps',
        type: 'Scene',
        parentId: 'atlas',
        color: '#abcdef',
        description: 'Battle maps',
        sort: 42
      });

      expect(create).toHaveBeenCalledWith({
        name: 'Maps',
        type: 'Scene',
        folder: 'atlas',
        color: '#abcdef',
        description: 'Battle maps',
        sort: 42
      });
      expect(created).toMatchObject({ id: 'new', name: 'Maps', type: 'Scene' });
    });

    it('sends only the attributes that are set', async () => {
      const create = jest.fn().mockResolvedValue(document());

      await storeFor([], create).createFolder({ name: 'Bare', type: 'Macro', color: undefined });

      const payload = create.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(Object.keys(payload)).toEqual(['name', 'type']);
    });

    it('never touches the world collection to create a folder', async () => {
      const create = jest.fn().mockResolvedValue(document());
      const globals = { Folder: { create } } as unknown as FoundryFolderGlobals;

      await expect(new FoundryFolderStore(() => globals).createFolder({ name: 'X', type: 'Actor' }))
        .resolves.toMatchObject({ id: 'heroes' });
    });

    it('resolves to null when the core created nothing', async () => {
      const create = jest.fn().mockResolvedValue(undefined);

      await expect(storeFor([], create).createFolder({ name: 'Vetoed', type: 'Actor' })).resolves.toBeNull();
    });
  });

  describe('updateFolder', () => {
    it('sends a partial update and returns the folder as it is afterwards', async () => {
      const doc = document();

      const updated = await storeFor([doc]).updateFolder('heroes', { name: 'Champions', parentId: 'legends' });

      expect(doc.update).toHaveBeenCalledWith({ name: 'Champions', folder: 'legends' });
      expect(updated).toMatchObject({ name: 'Champions', parentId: 'legends' });
    });

    it('passes a null parent through to move the folder to the root', async () => {
      const doc = document();

      const updated = await storeFor([doc]).updateFolder('heroes', { parentId: null });

      expect(doc.update).toHaveBeenCalledWith({ folder: null });
      expect(updated?.parentId).toBeNull();
    });

    it('passes null through to clear the color and the description', async () => {
      const doc = document();

      await storeFor([doc]).updateFolder('heroes', { color: null, description: null });

      expect(doc.update).toHaveBeenCalledWith({ color: null, description: null });
    });

    it('sends an empty update when nothing is set', async () => {
      const doc = document();

      await storeFor([doc]).updateFolder('heroes', { name: undefined, sort: undefined });

      expect(doc.update).toHaveBeenCalledWith({});
    });

    it('resolves to null for an unknown folder', async () => {
      await expect(storeFor([]).updateFolder('missing', { name: 'x' })).resolves.toBeNull();
    });
  });

  describe('deleteFolder', () => {
    it.each([
      ['neither choice', {}, {}],
      ['an undefined choice', { deleteSubfolders: undefined, deleteContents: undefined }, {}],
      ['subfolders only', { deleteSubfolders: true }, { deleteSubfolders: true }],
      ['contents only', { deleteContents: true }, { deleteContents: true }],
      ['explicit refusals', { deleteSubfolders: false, deleteContents: false }, { deleteSubfolders: false, deleteContents: false }]
    ])('passes %s to the core as given', async (_case, options, expected) => {
      const doc = document();

      await storeFor([doc]).deleteFolder('heroes', options);

      const sent = (doc.delete as jest.Mock).mock.calls[0]?.[0] as Record<string, unknown>;
      expect(sent).toEqual(expected);
      expect(Object.keys(sent)).toEqual(Object.keys(expected));
    });

    it('leaves an unknown folder alone', async () => {
      await expect(storeFor([]).deleteFolder('missing', {})).resolves.toBeUndefined();
    });
  });
});
