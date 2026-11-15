import type { GetNotesParams, GetNotesResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryNoteService,
  getNotesRequestSchema,
  toListNotesQuery,
  type NoteGameProvider
} from '@/core/notes';
import { toWireNote } from './noteWireMappers';

export interface NoteHandlerDependencies {
  gameProvider?: NoteGameProvider;
}

export function createGetNotesHandler(
  deps: NoteHandlerDependencies = {}
): (params: GetNotesParams) => Promise<GetNotesResult> {
  const service = createFoundryNoteService(deps.gameProvider);

  return function getNotesHandler(params: GetNotesParams): Promise<GetNotesResult> {
    try {
      const result = service.listNotes(toListNotesQuery(parseRequest(getNotesRequestSchema, params)));
      return Promise.resolve({ sceneId: result.sceneId, notes: result.notes.map(toWireNote) });
    } catch (error) {
      // Legacy contract of this command: it always rejects with an Error object.
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getNotesHandler = createGetNotesHandler();
