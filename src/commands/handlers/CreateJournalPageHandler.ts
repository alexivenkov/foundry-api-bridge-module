import type { CreateJournalPageParams, JournalPageResult } from '@/commands/types';
import {
  mapPageToResult,
  type FoundryGame,
  type FoundryPageCreateData
} from '@/commands/handlers/journalTypes';

declare const game: FoundryGame;

export async function createJournalPageHandler(
  params: CreateJournalPageParams
): Promise<JournalPageResult> {
  const journal = game.journal.get(params.journalId);

  if (!journal) {
    throw new Error(`Journal not found: ${params.journalId}`);
  }

  const pageType = params.type ?? 'text';
  const pageData: FoundryPageCreateData = {
    name: params.name,
    type: pageType
  };

  if (pageType === 'text' && params.content !== undefined) {
    pageData.text = { content: params.content };
  }

  const pages = await journal.createEmbeddedDocuments('JournalEntryPage', [pageData]);

  const createdPage = pages[0];

  if (!createdPage) {
    throw new Error('Failed to create journal page');
  }

  return mapPageToResult(createdPage);
}