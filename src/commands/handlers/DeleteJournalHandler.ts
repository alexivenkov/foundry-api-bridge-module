import type { DeleteJournalParams, DeleteResult } from '@/commands/types';
import type { FoundryGame } from '@/commands/handlers/journalTypes';

declare const game: FoundryGame;

export async function deleteJournalHandler(params: DeleteJournalParams): Promise<DeleteResult> {
  const journal = game.journal.get(params.journalId);

  if (!journal) {
    throw new Error(`Journal not found: ${params.journalId}`);
  }

  await journal.delete();

  return { deleted: true };
}