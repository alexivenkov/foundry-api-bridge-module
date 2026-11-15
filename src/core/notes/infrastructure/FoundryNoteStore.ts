import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import type { Note, NoteChanges, NoteDraft, NoteStore } from '@/core/notes/domain';
import type { FoundryNoteGame, FoundryNoteScene } from './foundryNoteTypes';
import { toFoundryNoteData, toNote } from './noteMapper';

export type NoteGameProvider = GameProvider<FoundryNoteGame>;

/** Anti-corruption layer over a scene's embedded Note documents. */
export class FoundryNoteStore implements NoteStore {
  constructor(private readonly gameProvider: NoteGameProvider) {}

  listNotes(sceneId: string): readonly Note[] {
    return this.requireScene(sceneId).notes.contents.map(toNote);
  }

  findNote(sceneId: string, noteId: string): Note | null {
    const document = this.requireScene(sceneId).notes.get(noteId);
    return document !== undefined ? toNote(document) : null;
  }

  async createNote(sceneId: string, draft: NoteDraft): Promise<Note | null> {
    const created = await this.requireScene(sceneId).createEmbeddedDocuments('Note', [toFoundryNoteData(draft)]);
    const document = created[0];
    return document !== undefined ? toNote(document) : null;
  }

  async updateNote(sceneId: string, noteId: string, changes: NoteChanges): Promise<Note | null> {
    const document = this.requireScene(sceneId).notes.get(noteId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryNoteData(changes));
    return toNote(document);
  }

  async deleteNote(sceneId: string, noteId: string): Promise<void> {
    await this.requireScene(sceneId).deleteEmbeddedDocuments('Note', [noteId]);
  }

  private requireScene(sceneId: string): FoundryNoteScene {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return scene;
  }
}
