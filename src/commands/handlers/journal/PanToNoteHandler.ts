import type { PanToNoteParams, PanToNoteResult } from '@/commands/types';
import { createFoundryJournalSharingService, panToNoteRequestSchema, toPanToNoteCommand } from '@/core/journals';
import { parseRequest } from '@/core/shared';
import type { JournalHandlerDependencies } from './journalWireMappers';

export function createPanToNoteHandler(
  deps: JournalHandlerDependencies = {}
): (params: PanToNoteParams) => Promise<PanToNoteResult> {
  const service = createFoundryJournalSharingService(deps.globals);

  return async function panToNoteHandler(params: PanToNoteParams): Promise<PanToNoteResult> {
    const { journalId, note } = await service.panToNote(
      toPanToNoteCommand(parseRequest(panToNoteRequestSchema, params))
    );
    return { panned: true, journalId, sceneId: note.sceneId, noteId: note.noteId, x: note.x, y: note.y };
  };
}

export const panToNoteHandler = createPanToNoteHandler();
