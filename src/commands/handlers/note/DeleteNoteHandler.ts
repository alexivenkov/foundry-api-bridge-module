import type { DeleteNoteParams, DeleteNoteResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryNoteService, deleteNoteRequestSchema, toDeleteNoteCommand } from '@/core/notes';
import type { NoteHandlerDependencies } from './GetNotesHandler';

export function createDeleteNoteHandler(
  deps: NoteHandlerDependencies = {}
): (params: DeleteNoteParams) => Promise<DeleteNoteResult> {
  const service = createFoundryNoteService(deps.gameProvider);

  return async function deleteNoteHandler(params: DeleteNoteParams): Promise<DeleteNoteResult> {
    const command = toDeleteNoteCommand(parseRequest(deleteNoteRequestSchema, params));
    const result = await service.deleteNote(command);
    return { deleted: true, noteId: result.noteId, sceneId: result.sceneId };
  };
}

export const deleteNoteHandler = createDeleteNoteHandler();
