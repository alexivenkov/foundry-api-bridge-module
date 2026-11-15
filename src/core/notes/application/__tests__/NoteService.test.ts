import { NoActiveSceneError, SceneNotFoundError, type SceneIdentity, type SceneLocator } from '../../../shared';
import {
  NoteCreationFailedError,
  NoteNotFoundError,
  type Note,
  type NoteChanges,
  type NoteDraft,
  type NoteStore
} from '../../domain';
import { NoteService } from '../NoteService';

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    x: 100,
    y: 200,
    entryId: null,
    pageId: null,
    text: null,
    iconSrc: 'icons/svg/book.svg',
    iconTint: null,
    iconSize: 40,
    fontSize: 32,
    textAnchor: 'bottom',
    textColor: null,
    global: false,
    ...overrides
  };
}

class FakeNoteStore implements NoteStore {
  readonly created: Array<{ sceneId: string; draft: NoteDraft }> = [];
  readonly updated: Array<{ sceneId: string; noteId: string; changes: NoteChanges }> = [];
  readonly deleted: Array<{ sceneId: string; noteId: string }> = [];
  createsNothing = false;
  losesNoteOnUpdate = false;

  constructor(private readonly byScene: Readonly<Record<string, readonly Note[]>>) {}

  listNotes(sceneId: string): readonly Note[] {
    return this.byScene[sceneId] ?? [];
  }

  findNote(sceneId: string, noteId: string): Note | null {
    return this.listNotes(sceneId).find((candidate) => candidate.id === noteId) ?? null;
  }

  createNote(sceneId: string, draft: NoteDraft): Promise<Note | null> {
    this.created.push({ sceneId, draft });
    return Promise.resolve(this.createsNothing ? null : note({ id: 'created', x: draft.x, y: draft.y }));
  }

  updateNote(sceneId: string, noteId: string, changes: NoteChanges): Promise<Note | null> {
    this.updated.push({ sceneId, noteId, changes });
    const current = this.findNote(sceneId, noteId);
    if (current === null || this.losesNoteOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...current, ...(changes.text !== undefined ? { text: changes.text } : {}) });
  }

  deleteNote(sceneId: string, noteId: string): Promise<void> {
    this.deleted.push({ sceneId, noteId });
    return Promise.resolve();
  }
}

function scenes(ids: readonly string[], activeId: string | null): SceneLocator {
  return {
    findScene: (sceneId): SceneIdentity | null => (ids.includes(sceneId) ? { id: sceneId, name: sceneId } : null),
    findActiveScene: (): SceneIdentity | null => (activeId !== null ? { id: activeId, name: activeId } : null)
  };
}

function setup(activeId: string | null = 'dungeon'): { service: NoteService; store: FakeNoteStore } {
  const store = new FakeNoteStore({ dungeon: [note({ id: 'pin', text: 'Trap' })], tavern: [note({ id: 'bar' })] });
  return { service: new NoteService({ scenes: scenes(['dungeon', 'tavern'], activeId), notes: store }), store };
}

describe('NoteService', () => {
  it('lists the notes of the active scene when no scene is named', () => {
    const result = setup().service.listNotes({ sceneId: undefined });

    expect(result.sceneId).toBe('dungeon');
    expect(result.notes.map((n) => n.id)).toEqual(['pin']);
  });

  it('lists the notes of the named scene', () => {
    expect(setup().service.listNotes({ sceneId: 'tavern' }).notes.map((n) => n.id)).toEqual(['bar']);
  });

  it('rejects an unknown scene and a missing active scene', () => {
    expect(() => setup().service.listNotes({ sceneId: 'missing' })).toThrow(SceneNotFoundError);
    expect(() => setup(null).service.listNotes({ sceneId: undefined })).toThrow(NoActiveSceneError);
  });

  it('creates the note in the resolved scene', async () => {
    const { service, store } = setup();
    const draft = { x: 5, y: 7, text: 'Secret door' };

    const created = await service.createNote({ sceneId: 'tavern', draft });

    expect(store.created).toEqual([{ sceneId: 'tavern', draft }]);
    expect(created).toMatchObject({ id: 'created', x: 5, y: 7 });
  });

  it('fails when the core created nothing', async () => {
    const { service, store } = setup();
    store.createsNothing = true;

    await expect(service.createNote({ sceneId: undefined, draft: { x: 0, y: 0 } }))
      .rejects.toThrow(NoteCreationFailedError);
  });

  it('applies the changes to an existing note', async () => {
    const { service, store } = setup();

    const updated = await service.updateNote({ sceneId: undefined, noteId: 'pin', changes: { text: null } });

    expect(store.updated).toEqual([{ sceneId: 'dungeon', noteId: 'pin', changes: { text: null } }]);
    expect(updated.text).toBeNull();
  });

  it('rejects an unknown note without touching the store', async () => {
    const { service, store } = setup();

    await expect(service.updateNote({ sceneId: undefined, noteId: 'missing', changes: {} }))
      .rejects.toThrow('Note not found: missing');
    await expect(service.deleteNote({ sceneId: undefined, noteId: 'missing' })).rejects.toThrow(NoteNotFoundError);
    expect(store.updated).toEqual([]);
    expect(store.deleted).toEqual([]);
  });

  it('looks the note up in the named scene only', async () => {
    await expect(setup().service.updateNote({ sceneId: 'tavern', noteId: 'pin', changes: {} }))
      .rejects.toThrow(NoteNotFoundError);
  });

  it('reports the note as missing when it vanished during the update', async () => {
    const { service, store } = setup();
    store.losesNoteOnUpdate = true;

    await expect(service.updateNote({ sceneId: undefined, noteId: 'pin', changes: {} }))
      .rejects.toThrow(NoteNotFoundError);
  });

  it('deletes an existing note and reports where it was', async () => {
    const { service, store } = setup();

    const result = await service.deleteNote({ sceneId: undefined, noteId: 'pin' });

    expect(store.deleted).toEqual([{ sceneId: 'dungeon', noteId: 'pin' }]);
    expect(result).toEqual({ sceneId: 'dungeon', noteId: 'pin' });
  });
});
