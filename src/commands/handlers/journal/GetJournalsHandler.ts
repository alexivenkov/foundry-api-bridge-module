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

/** Mapping options. `light` = index only: no page text/markdown, no enrichHTML. */
export interface JournalMapOptions {
  light?: boolean;
}

function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

function getTextEditor(): TextEditorClass | undefined {
  return (globalThis as unknown as { TextEditor?: TextEditorClass }).TextEditor;
}

function pageType(page: FoundryPage): string {
  return typeof page.type === 'string' ? page.type : String(page.type);
}

/** Index entry: everything except content. Synchronous — no enrichment. */
function mapPageToIndex(page: FoundryPage): JournalPageData {
  return {
    id: String(page.id),
    name: page.name,
    type: pageType(page),
    text: null,
    markdown: null,
    enrichedText: null,
    src: page.src ?? null
  };
}

async function mapPageToData(page: FoundryPage): Promise<JournalPageData> {
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
    type: pageType(page),
    text: textContent,
    markdown: page.text.markdown ?? null,
    enrichedText,
    src: page.src ?? null
  };
}

async function mapJournalToData(journal: FoundryJournal, options: JournalMapOptions = {}): Promise<JournalData> {
  const pages: FoundryPage[] = [];
  journal.pages.forEach(page => {
    pages.push(page);
  });

  const mappedPages = options.light === true
    ? pages.map(mapPageToIndex)
    : await Promise.all(pages.map(mapPageToData));

  return {
    id: journal.id,
    uuid: journal.uuid,
    name: journal.name,
    folder: journal.folder?.name ?? null,
    pages: mappedPages
  };
}

export { mapJournalToData, type FoundryJournal };

export async function getJournalsHandler(params: GetJournalsParams): Promise<JournalData[]> {
  const game = getGame();
  const journals: FoundryJournal[] = [];

  game.journal?.forEach(journal => {
    journals.push(journal);
  });

  const options: JournalMapOptions = { light: params.light === true };
  return Promise.all(journals.map(journal => mapJournalToData(journal, options)));
}
