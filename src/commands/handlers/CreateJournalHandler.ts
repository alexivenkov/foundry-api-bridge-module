import type { CreateJournalParams, JournalResult } from '@/commands/types';
import {
  mapJournalToResult,
  type JournalEntryConstructor,
  type FoundryJournalCreateData,
  type FoundryPageCreateData
} from '@/commands/handlers/journalTypes';

declare const JournalEntry: JournalEntryConstructor;

export async function createJournalHandler(params: CreateJournalParams): Promise<JournalResult> {
  const journalData: FoundryJournalCreateData = {
    name: params.name
  };

  if (params.folder !== undefined) {
    journalData.folder = params.folder;
  }

  if (params.content !== undefined) {
    const pageType = params.pageType ?? 'text';
    const pageData: FoundryPageCreateData = {
      name: params.name,
      type: pageType
    };

    if (pageType === 'text') {
      pageData.text = { content: params.content };
    }

    journalData.pages = [pageData];
  }

  const journal = await JournalEntry.create(journalData);

  return mapJournalToResult(journal);
}