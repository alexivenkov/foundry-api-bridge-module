import type { NoteChanges, NoteDraft } from '@/core/notes/domain';

export interface ListNotesQuery {
  readonly sceneId: string | undefined;
}

export interface CreateNoteCommand {
  readonly sceneId: string | undefined;
  readonly draft: NoteDraft;
}

export interface UpdateNoteCommand {
  readonly sceneId: string | undefined;
  readonly noteId: string;
  readonly changes: NoteChanges;
}

export interface DeleteNoteCommand {
  readonly sceneId: string | undefined;
  readonly noteId: string;
}
