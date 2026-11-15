import type { FoundryJournalCategories, FoundryJournalCategory } from './foundryJournalCategoryTypes';

/**
 * The JournalEntryPage fields the context reads and writes (`BaseJournalEntryPage` schema, Foundry 13–14).
 * The schema gives every page `title`, `image`, `video` and `sort`; `category` exists from 13.
 */
export interface FoundryJournalPage {
  id: string;
  name: string;
  type: string;
  src?: string | null | undefined;
  text: {
    content?: string | undefined;
    markdown?: string | undefined;
    /** `CONST.JOURNAL_ENTRY_PAGE_FORMATS` code. */
    format?: number | undefined;
  };
  title?: { show?: boolean | undefined; level?: number | undefined } | undefined;
  image?: { caption?: string | undefined } | undefined;
  video?:
    | {
        controls?: boolean | undefined;
        loop?: boolean | undefined;
        autoplay?: boolean | undefined;
        volume?: number | undefined;
        timestamp?: number | null | undefined;
        width?: number | null | undefined;
        height?: number | null | undefined;
      }
    | undefined;
  sort?: number | undefined;
  category?: string | null | undefined;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryJournalPages {
  get(id: string): FoundryJournalPage | undefined;
  map<T>(transform: (page: FoundryJournalPage) => T): T[];
  forEach(visit: (page: FoundryJournalPage) => void): void;
}

/** The JournalEntry fields the context reads and writes (`BaseJournalEntry` schema, Foundry 13–14). */
export interface FoundryJournalEntry {
  id: string;
  uuid: string;
  name: string;
  folder: { id: string; name: string } | null;
  pages: FoundryJournalPages;
  /** Foundry 13+. */
  categories?: FoundryJournalCategories | undefined;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
  createEmbeddedDocuments(type: 'JournalEntryPage', data: Record<string, unknown>[]): Promise<FoundryJournalPage[]>;
  createEmbeddedDocuments(
    type: 'JournalEntryCategory',
    data: Record<string, unknown>[]
  ): Promise<FoundryJournalCategory[]>;
  deleteEmbeddedDocuments(type: 'JournalEntryPage' | 'JournalEntryCategory', ids: string[]): Promise<unknown>;
  /** Animates the canvas to the entry's first note on the viewed scene; resolves at once when there is none. */
  panToNote?(options: { scale?: number; duration?: number }): Promise<unknown>;
}

export interface FoundryJournalCollection {
  get(id: string): FoundryJournalEntry | undefined;
  forEach(visit: (entry: FoundryJournalEntry) => void): void;
}

export interface FoundryJournalShowOptions {
  force?: boolean;
  users?: unknown;
}

/** `ShareImageConfig` of `Journal.showImage` (13.351, 14.368); the server relays it to the listed users or to all. */
export interface FoundryShareImageOptions {
  users: string[];
  title?: string;
  caption?: string;
}

/** The journal collection class; `show` asks the players' clients to open the document. */
export interface FoundryJournalClass {
  show(document: FoundryJournalEntry | FoundryJournalPage, options: FoundryJournalShowOptions): Promise<unknown>;
  showImage?(src: string, options: FoundryShareImageOptions): unknown;
}

export interface FoundryTextEditorClass {
  enrichHTML(content: string, options?: { secrets?: boolean }): Promise<string>;
}

/** A placed note on the canvas (`Note` placeable over a `NoteDocument`). */
export interface FoundryCanvasNote {
  document: { id: string; entryId: string | null; x: number; y: number };
}

/** The canvas of the GM's browser: the scene it shows and that scene's notes layer. */
export interface FoundryJournalCanvas {
  ready: boolean;
  scene: { id: string } | null;
  notes?: { placeables: FoundryCanvasNote[] } | undefined;
}

export interface FoundryJournalGlobals {
  game: {
    journal: FoundryJournalCollection | undefined;
    users?: { get(id: string): unknown } | undefined;
  };
  JournalEntry: {
    create(data: Record<string, unknown>): Promise<FoundryJournalEntry | null | undefined>;
  };
  /** Where Foundry 13 and later keep the two classes below. */
  foundry?: {
    documents?: { collections?: { Journal?: FoundryJournalClass } };
    applications?: { ux?: { TextEditor?: { implementation?: FoundryTextEditorClass } } };
  };
  /** The only home of the class up to Foundry 12; from 13 a deprecated alias that logs a warning (until 15). */
  Journal: FoundryJournalClass;
  /** As `Journal`. */
  TextEditor?: FoundryTextEditorClass;
  canvas?: FoundryJournalCanvas | null | undefined;
}

export type JournalGlobalsProvider = () => FoundryJournalGlobals;
