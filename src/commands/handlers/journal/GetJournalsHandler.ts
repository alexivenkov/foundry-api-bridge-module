import type { JournalData, JournalPageData } from '@/types/foundry';
import type { GetJournalsParams } from '@/commands/types';

interface FoundryPage {
  id: string | number;
  name: string;
  type: string | number;
  text: {
    content: string | undefined;
    markdown: string | undefined;
  };
}

interface FoundryJournal {
  id: string;
  uuid: string;
  name: string;
  folder: { name: string } | null;
  pages: {
    forEach(fn: (page: FoundryPage) => void): void;
  };
}

interface FoundryJournalCollection {
  forEach(fn: (journal: FoundryJournal) => void): void;
}

interface FoundryGame {
  journal: FoundryJournalCollection | undefined;
}

function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

function mapPageToData(page: FoundryPage): JournalPageData {
  const pageType = page.type;
  return {
    id: String(page.id),
    name: page.name,
    type: typeof pageType === 'string' ? pageType : String(pageType),
    text: page.text.content ?? null,
    markdown: page.text.markdown ?? null
  };
}

function mapJournalToData(journal: FoundryJournal): JournalData {
  const pages: JournalPageData[] = [];
  journal.pages.forEach(page => {
    pages.push(mapPageToData(page));
  });

  return {
    id: journal.id,
    uuid: journal.uuid,
    name: journal.name,
    folder: journal.folder?.name ?? null,
    pages
  };
}

export { mapJournalToData, type FoundryJournal };

export function getJournalsHandler(_params: GetJournalsParams): Promise<JournalData[]> {
  const game = getGame();
  const journals: JournalData[] = [];

  game.journal?.forEach(journal => {
    journals.push(mapJournalToData(journal));
  });

  return Promise.resolve(journals);
}
