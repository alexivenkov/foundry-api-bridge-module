import type { Note, NoteChanges, NoteDraft } from '@/core/notes/domain/model/Note';

// Reads are synchronous: a scene's notes live in memory. `createNote` resolves
// to null when the core created nothing; `updateNote` when the note is gone.
export interface NoteStore {
  listNotes(sceneId: string): readonly Note[];
  findNote(sceneId: string, noteId: string): Note | null;
  createNote(sceneId: string, draft: NoteDraft): Promise<Note | null>;
  updateNote(sceneId: string, noteId: string, changes: NoteChanges): Promise<Note | null>;
  deleteNote(sceneId: string, noteId: string): Promise<void>;
}
