import type { SceneIdentity, SceneLocator } from '../../../shared';
import type { Note, NoteChanges, NoteDraft, NoteEnvironment, NoteStore } from '../../domain';
import { NoteService } from '../NoteService';

const NOTE: Note = {
  id: 'n1',
  x: 0,
  y: 0,
  entryId: null,
  pageId: null,
  text: null,
  iconSrc: 'icons/svg/book.svg',
  iconTint: null,
  iconSize: 40,
  fontSize: 32,
  textAnchor: 'bottom',
  textColor: null,
  global: false
};

class Store implements NoteStore {
  readonly writes: Array<NoteDraft | NoteChanges> = [];
  listNotes(): readonly Note[] {
    return [NOTE];
  }
  findNote(_sceneId: string, noteId: string): Note | null {
    return noteId === NOTE.id ? NOTE : null;
  }
  createNote(_sceneId: string, draft: NoteDraft): Promise<Note | null> {
    this.writes.push(draft);
    return Promise.resolve(NOTE);
  }
  updateNote(_sceneId: string, _noteId: string, changes: NoteChanges): Promise<Note | null> {
    this.writes.push(changes);
    return Promise.resolve(NOTE);
  }
  deleteNote(): Promise<void> {
    return Promise.resolve();
  }
}

const scenes: SceneLocator = {
  findScene: (id): SceneIdentity | null => (id === 'keep' ? { id, name: 'Keep' } : null),
  findActiveScene: () => ({ id: 'keep', name: 'Keep' })
};

function setup(levels: boolean): { service: NoteService; store: Store; asked: string[] } {
  const asked: string[] = [];
  const environment: NoteEnvironment = {
    features: () => ({ levels }),
    listSceneLevelIds: (sceneId) => {
      asked.push(sceneId);
      return ['ground'];
    }
  };
  const store = new Store();
  return { service: new NoteService({ scenes, notes: store, environment }), store, asked };
}

describe('NoteService note details', () => {
  it('writes elevation, sort and font on any generation', async () => {
    const { service, store } = setup(false);

    await service.updateNote({ sceneId: undefined, noteId: 'n1', changes: { elevation: 10, sort: 3, fontFamily: null } });

    expect(store.writes).toEqual([{ elevation: 10, sort: 3, fontFamily: null }]);
  });

  it('refuses a lock on a core without levels and writes nothing', async () => {
    const { service, store } = setup(false);

    await expect(service.createNote({ sceneId: 'keep', draft: { x: 1, y: 2, locked: true } })).rejects.toThrow(
      'Note locks and scene levels require Foundry 14 or newer'
    );
    expect(store.writes).toEqual([]);
  });

  it('checks levels against the levels of the note scene', async () => {
    const { service, asked } = setup(true);

    await expect(service.updateNote({ sceneId: 'keep', noteId: 'n1', changes: { levels: ['roof'] } })).rejects.toThrow(
      'Unknown scene level: roof'
    );
    await service.updateNote({ sceneId: 'keep', noteId: 'n1', changes: { levels: ['ground'] } });
    expect(asked).toEqual(['keep', 'keep']);
  });
});
