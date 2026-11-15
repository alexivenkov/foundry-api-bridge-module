import { FoundryMacroStore } from '../FoundryMacroStore';
import type { FoundryMacroDocument, FoundryMacroGlobals } from '../foundryMacroTypes';

function document(overrides: Partial<FoundryMacroDocument> = {}): FoundryMacroDocument {
  const doc: FoundryMacroDocument = {
    id: 'm1',
    uuid: 'Macro.m1',
    name: 'Greeting',
    type: 'chat',
    img: 'icons/svg/dice-target.svg',
    command: '/r 1d20',
    scope: 'global',
    folder: null,
    author: null,
    update: jest.fn(),
    delete: jest.fn(),
    execute: jest.fn(),
    ...overrides
  };
  (doc.update as jest.Mock).mockImplementation((data: Partial<FoundryMacroDocument>) => {
    Object.assign(doc, data);
    return Promise.resolve(doc);
  });
  (doc.delete as jest.Mock).mockResolvedValue(doc);
  return doc;
}

function storeOver(documents: FoundryMacroDocument[] = []): { store: FoundryMacroStore; create: jest.Mock } {
  const create = jest.fn();
  const globals: FoundryMacroGlobals = {
    game: {
      macros: { contents: documents, get: (id) => documents.find((doc) => doc.id === id) },
      actors: { get: () => undefined }
    },
    Macro: { create },
    ChatMessage: { implementation: { getSpeaker: jest.fn() } }
  };
  return { store: new FoundryMacroStore(() => globals), create };
}

describe('FoundryMacroStore', () => {
  describe('reading', () => {
    it('maps a macro document, naming its folder and its author', () => {
      const { store } = storeOver([
        document({
          id: 'a',
          uuid: 'Macro.a',
          name: 'Roll Attack',
          type: 'script',
          img: 'icons/sword.png',
          command: 'return 1',
          scope: 'actor',
          folder: { id: 'f1', name: 'Combat' },
          author: { id: 'u1', name: 'GM' }
        })
      ]);

      expect(store.listMacros()).toEqual([
        {
          id: 'a',
          uuid: 'Macro.a',
          name: 'Roll Attack',
          type: 'script',
          img: 'icons/sword.png',
          command: 'return 1',
          scope: 'actor',
          folderName: 'Combat',
          authorId: 'u1'
        }
      ]);
    });

    it.each([null, undefined])('reads a %s folder and author as none', (absent) => {
      const { store } = storeOver([document({ folder: absent, author: absent })]);

      expect(store.findMacro('m1')).toMatchObject({ folderName: null, authorId: null });
    });

    it('lists the macros in directory order', () => {
      const { store } = storeOver([document({ id: 'b' }), document({ id: 'a' })]);

      expect(store.listMacros().map((macro) => macro.id)).toEqual(['b', 'a']);
    });

    it('returns null for an unknown macro', () => {
      expect(storeOver().store.findMacro('missing')).toBeNull();
    });

    it('reads the globals on every call, not when it is built', () => {
      let documents: FoundryMacroDocument[] = [];
      const store = new FoundryMacroStore(() => ({
        game: { macros: { contents: documents, get: () => undefined }, actors: { get: () => undefined } },
        Macro: { create: jest.fn() },
        ChatMessage: { implementation: { getSpeaker: jest.fn() } }
      }));

      expect(store.listMacros()).toEqual([]);
      documents = [document()];
      expect(store.listMacros()).toHaveLength(1);
    });
  });

  describe('createMacro', () => {
    it('creates through the Macro class with the core field names and returns the new macro', async () => {
      const { store, create } = storeOver();
      create.mockResolvedValue(document({ id: 'new', name: 'Full', folder: { id: 'f1', name: 'Combat' } }));

      const created = await store.createMacro({
        name: 'Full',
        type: 'chat',
        command: '/whisper gm hi',
        scope: 'actors',
        img: 'icons/full.png',
        folderId: 'f1'
      });

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith({
        name: 'Full',
        type: 'chat',
        command: '/whisper gm hi',
        scope: 'actors',
        img: 'icons/full.png',
        folder: 'f1'
      });
      expect(created).toMatchObject({ id: 'new', folderName: 'Combat' });
    });

    it('states name, type and command even when unset, and nothing else', async () => {
      const { store, create } = storeOver();
      create.mockResolvedValue(document());

      await store.createMacro({ name: 'Bare' });

      const data = create.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(Object.keys(data)).toEqual(['name', 'type', 'command']);
      expect(data).toEqual({ name: 'Bare', type: undefined, command: undefined });
    });

    it('sends a null folder as the directory root', async () => {
      const { store, create } = storeOver();
      create.mockResolvedValue(document());

      await store.createMacro({ name: 'Rooted', folderId: null });

      expect(create.mock.calls[0]?.[0]).toHaveProperty('folder', null);
    });

    it.each([undefined, null])('resolves to null when the core created nothing (%s)', async (nothing) => {
      const { store, create } = storeOver();
      create.mockResolvedValue(nothing);

      await expect(store.createMacro({ name: 'Vetoed' })).resolves.toBeNull();
    });

    it('does not need a game to create a macro', async () => {
      const create = jest.fn().mockResolvedValue(document());
      const store = new FoundryMacroStore(() => ({ Macro: { create } }) as unknown as FoundryMacroGlobals);

      await expect(store.createMacro({ name: 'Early' })).resolves.toMatchObject({ id: 'm1' });
    });
  });

  describe('updateMacro', () => {
    it('sends only the attributes that are set and returns the macro as the update left it', async () => {
      const doc = document();
      const { store } = storeOver([doc]);

      const updated = await store.updateMacro('m1', { name: 'Renamed', img: undefined });

      expect(doc.update).toHaveBeenCalledWith({ name: 'Renamed' });
      expect(Object.keys((doc.update as jest.Mock).mock.calls[0]?.[0] as object)).toEqual(['name']);
      expect(updated?.name).toBe('Renamed');
    });

    it('maps every attribute to its core field', async () => {
      const doc = document();
      const { store } = storeOver([doc]);

      await store.updateMacro('m1', {
        name: 'N',
        type: 'script',
        command: 'return 1',
        scope: 'actor',
        img: 'new.png',
        folderId: 'f1'
      });

      expect(doc.update).toHaveBeenCalledWith({
        name: 'N',
        type: 'script',
        command: 'return 1',
        scope: 'actor',
        img: 'new.png',
        folder: 'f1'
      });
    });

    it('moves a macro to the root with a null folder', async () => {
      const doc = document({ folder: { id: 'f1', name: 'Combat' } });
      const { store } = storeOver([doc]);

      await store.updateMacro('m1', { folderId: null });

      expect(doc.update).toHaveBeenCalledWith({ folder: null });
    });

    it('still calls the core with an empty change set', async () => {
      const doc = document();
      const { store } = storeOver([doc]);

      await store.updateMacro('m1', {});

      expect(doc.update).toHaveBeenCalledWith({});
    });

    it('reads the macro back from the document when the core resolved to nothing', async () => {
      const doc = document();
      (doc.update as jest.Mock).mockResolvedValue(undefined);
      const { store } = storeOver([doc]);

      await expect(store.updateMacro('m1', { name: 'Refused' })).resolves.toMatchObject({ name: 'Greeting' });
    });

    it('resolves to null for a macro that is gone', async () => {
      await expect(storeOver().store.updateMacro('missing', { name: 'X' })).resolves.toBeNull();
    });
  });

  describe('deleteMacro', () => {
    it('deletes the document', async () => {
      const doc = document();
      const { store } = storeOver([doc]);

      await store.deleteMacro('m1');

      expect(doc.delete).toHaveBeenCalledTimes(1);
    });

    it('lets a refusal of the core through', async () => {
      const doc = document();
      (doc.delete as jest.Mock).mockRejectedValue(new Error('cannot delete'));
      const { store } = storeOver([doc]);

      await expect(store.deleteMacro('m1')).rejects.toThrow('cannot delete');
    });

    it('does nothing for a macro that is gone', async () => {
      await expect(storeOver().store.deleteMacro('missing')).resolves.toBeUndefined();
    });
  });
});
