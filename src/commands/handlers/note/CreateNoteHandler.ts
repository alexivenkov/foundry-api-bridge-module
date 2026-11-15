import type { CreateNoteParams, CreateNoteResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryNoteService, createNoteRequestSchema, toCreateNoteCommand } from '@/core/notes';
import type { NoteHandlerDependencies } from './GetNotesHandler';
import { toWireNote } from './noteWireMappers';

export function createCreateNoteHandler(
  deps: NoteHandlerDependencies = {}
): (params: CreateNoteParams) => Promise<CreateNoteResult> {
  const service = createFoundryNoteService(deps.gameProvider);

  return async function createNoteHandler(params: CreateNoteParams): Promise<CreateNoteResult> {
    const command = toCreateNoteCommand(parseRequest(createNoteRequestSchema, params));
    return toWireNote(await service.createNote(command));
  };
}

export const createNoteHandler = createCreateNoteHandler();
