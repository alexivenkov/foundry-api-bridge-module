import type { JournalData, JournalPageData } from '@/types/foundry';
import type { GetJournalsParams } from '@/commands/types';

interface FoundryPage {
  id: string | number;
  name: string;
  type: string | number;
  src: string | undefined;
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

interface TextEditorClass {
  enrichHTML(content: string, options?: { secrets?: boolean }): Promise<string>;
}

function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

function getTextEditor(): TextEditorClass | undefined {
  return (globalThis as unknown as { TextEditor?: TextEditorClass }).TextEditor;
}

async function mapPageToData(page: FoundryPage): Promise<JournalPageData> {
  const pageType = page.type;
  const textContent = page.text.content ?? null;

  let enrichedText: string | null = null;
  if (textContent !== null) {
    const editor = getTextEditor();
    if (editor) {
      try {
        enrichedText = await editor.enrichHTML(textContent, { secrets: true });
      } catch {
        enrichedText = textContent;
      }
    }
  }

  return {
    id: String(page.id),
    name: page.name,
    type: typeof pageType === 'string' ? pageType : String(pageType),
    text: textContent,
    markdown: page.text.markdown ?? null,
    enrichedText,
    src: page.src ?? null
  };
}

async function mapJournalToData(journal: FoundryJournal): Promise<JournalData> {
  const pages: FoundryPage[] = [];
  journal.pages.forEach(page => {
    pages.push(page);
  });

  const mappedPages = await Promise.all(pages.map(mapPageToData));

  return {
    id: journal.id,
    uuid: journal.uuid,
    name: journal.name,
    folder: journal.folder?.name ?? null,
    pages: mappedPages
  };
}

export { mapJournalToData, type FoundryJournal };

export async function getJournalsHandler(_params: GetJournalsParams): Promise<JournalData[]> {
  const game = getGame();
  const journals: FoundryJournal[] = [];

  game.journal?.forEach(journal => {
    journals.push(journal);
  });

  return Promise.all(journals.map(mapJournalToData));
}
