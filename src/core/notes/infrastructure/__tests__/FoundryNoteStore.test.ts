import { SceneNotFoundError } from '../../../shared';
import { FoundryNoteStore } from '../FoundryNoteStore';
import type { FoundryNoteDocument, FoundryNoteGame, FoundryNoteScene } from '../foundryNoteTypes';

function document(overrides: Partial<FoundryNoteDocument> = {}): FoundryNoteDocument {
  const doc: FoundryNoteDocument = {
    id: 'n1',
    _id: 'n1',
    x: 100,
    y: 200,
    entryId: 'entry-1',
    pageId: 'page-1',
    text: 'Label',
    texture: { src: 'icons/svg/book.svg', tint: '#ffffff' },
    iconSize: 40,
    fontSize: 32,
    textAnchor: 1,
    textColor: '#ffaa00',
    global: false,
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides
  };
  (doc.update as jest.Mock).mockImplementation((data: Partial<FoundryNoteDocument>) => {
    Object.assign(doc, data);
    return Promise.resolve(doc);
  });
  return doc;
}

interface SceneMocks {
  scene: FoundryNoteScene;
  create: jest.Mock;
  remove: jest.Mock;
}

function scene(id: string, documents: FoundryNoteDocument[] = []): SceneMocks {
  const create = jest.fn();
  const remove = jest.fn().mockResolvedValue([]);
  return {
    scene: {
      id,
      notes: { get: (noteId) => documents.find((doc) => doc._id === noteId), contents: documents },
      createEmbeddedDocuments: create,
      deleteEmbeddedDocuments: remove
    },
    create,
    remove
  };
}

function storeFor(...scenes: FoundryNoteScene[]): FoundryNoteStore {
  const game: FoundryNoteGame = {
    scenes: { get: (id) => scenes.find((candidate) => candidate.id === id), active: scenes[0] ?? null }
  };
  return new FoundryNoteStore({ getGame: () => game });
}

describe('FoundryNoteStore', () => {
  describe('reading', () => {
    it('maps a note, taking the icon from the texture field', () => {
      const { scene: dungeon } = scene('dungeon', [document()]);

      expect(storeFor(dungeon).listNotes('dungeon')).toEqual([
        {
          id: 'n1',
          x: 100,
          y: 200,
          entryId: 'entry-1',
          pageId: 'page-1',
          text: 'Label',
          iconSrc: 'icons/svg/book.svg',
          iconTint: '#ffffff',
          iconSize: 40,
          fontSize: 32,
          textAnchor: 'bottom',
          textColor: '#ffaa00',
          global: false
        }
      ]);
    });

    it('ignores a stray icon property', () => {
      const doc = document({ texture: { src: 'icons/svg/anchor.svg' } });
      (doc as unknown as Record<string, unknown>)['icon'] = { src: 'icons/svg/wrong.svg' };

      expect(storeFor(scene('dungeon', [doc]).scene).findNote('dungeon', 'n1')?.iconSrc).toBe('icons/svg/anchor.svg');
    });

    it('falls back to an empty icon and the center anchor for missing or unknown values', () => {
      const doc = document({ texture: undefined, textAnchor: 99 });

      expect(storeFor(scene('dungeon', [doc]).scene).findNote('dungeon', 'n1')).toMatchObject({
        iconSrc: '',
        iconTint: null,
        textAnchor: 'center'
      });
    });

    it('returns null for an unknown note and rejects an unknown scene', () => {
      const store = storeFor(scene('dungeon').scene);

      expect(store.findNote('dungeon', 'missing')).toBeNull();
      expect(() => store.listNotes('missing')).toThrow(SceneNotFoundError);
    });
  });

  describe('createNote', () => {
    it('writes the icon into texture and the anchor as its core code', async () => {
      const { scene: dungeon, create } = scene('dungeon');
      create.mockResolvedValue([document({ id: 'new', _id: 'new' })]);

      const created = await storeFor(dungeon).createNote('dungeon', {
        x: 10,
        y: 20,
        entryId: 'e1',
        text: 'Pin',
        iconSrc: 'icons/x.svg',
        iconTint: '#ff0000',
        iconSize: 64,
        textAnchor: 'right',
        global: true
      });

      expect(create).toHaveBeenCalledWith('Note', [
        {
          x: 10,
          y: 20,
          entryId: 'e1',
          text: 'Pin',
          iconSize: 64,
          textAnchor: 4,
          global: true,
          texture: { src: 'icons/x.svg', tint: '#ff0000' }
        }
      ]);
      expect(created?.id).toBe('new');
    });

    it('sends only the attributes that are set and no texture without an icon', async () => {
      const { scene: dungeon, create } = scene('dungeon');
      create.mockResolvedValue([document()]);

      await storeFor(dungeon).createNote('dungeon', { x: 1, y: 2, text: undefined });

      expect(create).toHaveBeenCalledWith('Note', [{ x: 1, y: 2 }]);
    });

    it('resolves to null when the core created nothing', async () => {
      const { scene: dungeon, create } = scene('dungeon');
      create.mockResolvedValue([]);

      await expect(storeFor(dungeon).createNote('dungeon', { x: 1, y: 2 })).resolves.toBeNull();
    });
  });

  describe('updateNote', () => {
    it('passes null through to clear a link, the label or the tint', async () => {
      const doc = document();
      const { scene: dungeon } = scene('dungeon', [doc]);

      await storeFor(dungeon).updateNote('dungeon', 'n1', { entryId: null, text: null, iconTint: null });

      expect(doc.update).toHaveBeenCalledWith({ entryId: null, text: null, texture: { tint: null } });
    });

    it('returns the note as it is after the update', async () => {
      const { scene: dungeon } = scene('dungeon', [document()]);

      const updated = await storeFor(dungeon).updateNote('dungeon', 'n1', { x: 500, textAnchor: 'top' });

      expect(updated).toMatchObject({ x: 500, textAnchor: 'top' });
    });

    it('resolves to null for an unknown note', async () => {
      await expect(storeFor(scene('dungeon').scene).updateNote('dungeon', 'missing', {})).resolves.toBeNull();
    });
  });

  it('deletes the embedded document by id', async () => {
    const { scene: dungeon, remove } = scene('dungeon', [document()]);

    await storeFor(dungeon).deleteNote('dungeon', 'n1');

    expect(remove).toHaveBeenCalledWith('Note', ['n1']);
  });
});
