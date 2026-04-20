import type { ShowJournalParams, ShowJournalResult } from '@/commands/types';

interface FoundryDocument {
  id: string;
  name: string;
}

interface FoundryPage extends FoundryDocument {
  type: string;
}

interface FoundryPagesCollection {
  get(id: string): FoundryPage | undefined;
}

interface FoundryJournalEntry extends FoundryDocument {
  pages: FoundryPagesCollection;
}

interface FoundryJournalCollection {
  get(id: string): FoundryJournalEntry | undefined;
}

interface FoundryGame {
  journal: FoundryJournalCollection;
}

interface JournalClass {
  show(doc: FoundryDocument, options?: { force?: boolean; users?: string[] }): Promise<void>;
}

declare const game: FoundryGame;
declare const Journal: JournalClass;

export async function showJournalHandler(
  params: ShowJournalParams
): Promise<ShowJournalResult> {
  const journal = game.journal.get(params.journalId);

  if (!journal) {
    throw new Error(`Journal not found: ${params.journalId}`);
  }

  let target: FoundryDocument = journal;

  if (params.pageId !== undefined) {
    const page = journal.pages.get(params.pageId);
    if (!page) {
      throw new Error(`Page not found: ${params.pageId}`);
    }
    target = page;
  }

  const showOptions: { force?: boolean; users?: string[] } = {};
  if (params.force) {
    showOptions.force = true;
  }
  if (params.users !== undefined) {
    showOptions.users = params.users;
  }

  await Journal.show(target, showOptions);

  const result: ShowJournalResult = {
    shown: true,
    journalId: journal.id,
    journalName: journal.name
  };

  if (params.pageId !== undefined) {
    result.pageId = params.pageId;
  }

  return result;
}
