import type { UpdateNoteParams, UpdateNoteResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryNoteService, toUpdateNoteCommand, updateNoteRequestSchema } from '@/core/notes';
import type { NoteHandlerDependencies } from './GetNotesHandler';
import { toWireNote } from './noteWireMappers';

export function createUpdateNoteHandler(
  deps: NoteHandlerDependencies = {}
): (params: UpdateNoteParams) => Promise<UpdateNoteResult> {
  const service = createFoundryNoteService(deps.gameProvider);

  return async function updateNoteHandler(params: UpdateNoteParams): Promise<UpdateNoteResult> {
    const command = toUpdateNoteCommand(parseRequest(updateNoteRequestSchema, params));
    return toWireNote(await service.updateNote(command));
  };
}

export const updateNoteHandler = createUpdateNoteHandler();
