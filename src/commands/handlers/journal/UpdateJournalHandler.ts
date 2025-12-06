import type { UpdateJournalParams, JournalResult } from '@/commands/types';
import {
  mapJournalToResult,
  type FoundryGame,
  type FoundryJournalUpdateData
} from './journalTypes';

declare const game: FoundryGame;

export async function updateJournalHandler(params: UpdateJournalParams): Promise<JournalResult> {
  const journal = game.journal.get(params.journalId);

  if (!journal) {
    throw new Error(`Journal not found: ${params.journalId}`);
  }

  const updateData: FoundryJournalUpdateData = {};

  if (params.name !== undefined) {
    updateData.name = params.name;
  }

  if (params.folder !== undefined) {
    updateData.folder = params.folder;
  }

  const updatedJournal = await journal.update(updateData);

  return mapJournalToResult(updatedJournal);
}