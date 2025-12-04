import type { UpdateJournalPageParams, JournalPageResult } from '@/commands/types';
import {
  mapPageToResult,
  type FoundryGame,
  type FoundryPageUpdateData
} from '@/commands/handlers/journalTypes';

declare const game: FoundryGame;

export async function updateJournalPageHandler(
  params: UpdateJournalPageParams
): Promise<JournalPageResult> {
  const journal = game.journal.get(params.journalId);

  if (!journal) {
    throw new Error(`Journal not found: ${params.journalId}`);
  }

  const page = journal.pages.get(params.pageId);

  if (!page) {
    throw new Error(`Page not found: ${params.pageId}`);
  }

  const updateData: FoundryPageUpdateData = {};

  if (params.name !== undefined) {
    updateData.name = params.name;
  }

  if (params.content !== undefined) {
    updateData.text = { content: params.content };
  }

  const updatedPage = await page.update(updateData);

  return mapPageToResult(updatedPage);
}