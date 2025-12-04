import type { DeleteJournalPageParams, DeleteResult } from '@/commands/types';
import type { FoundryGame } from '@/commands/handlers/journalTypes';

declare const game: FoundryGame;

export async function deleteJournalPageHandler(
  params: DeleteJournalPageParams
): Promise<DeleteResult> {
  const journal = game.journal.get(params.journalId);

  if (!journal) {
    throw new Error(`Journal not found: ${params.journalId}`);
  }

  const page = journal.pages.get(params.pageId);

  if (!page) {
    throw new Error(`Page not found: ${params.pageId}`);
  }

  await journal.deleteEmbeddedDocuments('JournalEntryPage', [params.pageId]);

  return { deleted: true };
}