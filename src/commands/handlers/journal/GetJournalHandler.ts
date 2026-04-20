import type { JournalData } from '@/types/foundry';
import type { GetJournalParams } from '@/commands/types';
import { mapJournalToData, type FoundryJournal } from './GetJournalsHandler';

interface FoundryJournalCollection {
  get(id: string): FoundryJournal | undefined;
}

interface FoundryGame {
  journal: FoundryJournalCollection;
}

function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

export async function getJournalHandler(params: GetJournalParams): Promise<JournalData> {
  const journal = getGame().journal.get(params.journalId);

  if (!journal) {
    throw new Error(`Journal not found: ${params.journalId}`);
  }

  return mapJournalToData(journal);
}
