import type { JournalCategory } from './JournalCategory';

/** What a page is when no type is named, and the only type that takes text content at creation. */
export const TEXT_PAGE_TYPE = 'text';

export const JOURNAL_PAGE_FORMATS = ['html', 'markdown'] as const;
export type JournalPageFormat = (typeof JOURNAL_PAGE_FORMATS)[number];

export const MIN_TITLE_LEVEL = 1;
export const MAX_TITLE_LEVEL = 6;

export interface JournalIdentity {
  readonly id: string;
  readonly name: string;
}

export interface JournalPageTitle {
  readonly show: boolean;
  readonly level: number;
}

export interface JournalPageVideo {
  readonly controls: boolean;
  readonly loop: boolean;
  readonly autoplay: boolean;
  readonly volume: number;
  /** Seconds from the start; null = the beginning. */
  readonly timestamp: number | null;
  readonly width: number | null;
  readonly height: number | null;
}

/** How a page is shown and filed. The core keeps all of it on every page, whatever its type. */
export interface JournalPageLayout {
  readonly src: string | null;
  readonly caption: string | null;
  readonly format: JournalPageFormat;
  readonly title: JournalPageTitle;
  readonly sort: number;
  /** Foundry 13+ only. Null when uncategorized or when its category is gone. */
  readonly categoryId?: string | null | undefined;
  readonly video: JournalPageVideo;
}

export interface JournalPageSummary {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  /** Read where the document carries it: on every page of a world. */
  readonly layout?: JournalPageLayout | undefined;
}

/** A journal as the write commands report it: where it is filed and which pages it has. */
export interface JournalSummary {
  readonly id: string;
  readonly name: string;
  readonly folderId: string | null;
  readonly pages: readonly JournalPageSummary[];
}

export interface JournalPageContent extends JournalPageSummary {
  /** HTML, as stored. */
  readonly text: string | null;
  readonly markdown: string | null;
  /** The file an image, video or PDF page shows. */
  readonly src: string | null;
}

/** A journal as it is stored, with everything its pages hold. */
export interface JournalContent {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly folderName: string | null;
  readonly pages: readonly JournalPageContent[];
  /** Foundry 13+ only, in their sort order. */
  readonly categories?: readonly JournalCategory[] | undefined;
}

export interface JournalPageView extends JournalPageContent {
  /** The text with document links, inline rolls and secrets resolved. */
  readonly enrichedText: string | null;
}

/** A journal as a reader gets it. */
export interface JournalView extends Omit<JournalContent, 'pages'> {
  readonly pages: readonly JournalPageView[];
}

export interface JournalPageTitleChanges {
  readonly show?: boolean | undefined;
  readonly level?: number | undefined;
}

/** `null` resets the timestamp or a dimension. */
export interface JournalPageVideoChanges {
  readonly controls?: boolean | undefined;
  readonly loop?: boolean | undefined;
  readonly autoplay?: boolean | undefined;
  readonly volume?: number | undefined;
  readonly timestamp?: number | null | undefined;
  readonly width?: number | null | undefined;
  readonly height?: number | null | undefined;
}

/** What a page write may set beyond its name, text and file. An omitted option is left untouched. */
export interface JournalPageOptions {
  /** `null` removes the caption. */
  readonly caption?: string | null | undefined;
  readonly format?: JournalPageFormat | undefined;
  readonly markdown?: string | undefined;
  readonly title?: JournalPageTitleChanges | undefined;
  readonly sort?: number | undefined;
  /** `null` leaves the page uncategorized. */
  readonly categoryId?: string | null | undefined;
  readonly video?: JournalPageVideoChanges | undefined;
}

/** `null` is handed to the core, which decides what it accepts. */
export interface JournalPageDraft extends JournalPageOptions {
  readonly name: string;
  readonly type: string;
  readonly text?: string | null | undefined;
  readonly src?: string | null | undefined;
}

export interface JournalDraft {
  readonly name: string;
  readonly folderId?: string | null | undefined;
  /** The page a journal is created with, when it is created with content. */
  readonly firstPage?: JournalPageDraft | undefined;
}

/** An omitted attribute is left untouched; `null` is handed to the core. */
export interface JournalChanges {
  readonly name?: string | null | undefined;
  readonly folderId?: string | null | undefined;
}

export interface JournalPageChanges extends JournalPageOptions {
  readonly name?: string | null | undefined;
  /** Written to the page's text content, whatever the type of the page. */
  readonly text?: string | null | undefined;
  readonly src?: string | null | undefined;
}

export interface JournalPageSpec extends JournalPageOptions {
  readonly name: string;
  readonly type?: string | undefined;
  readonly content?: string | null | undefined;
  readonly src?: string | null | undefined;
}

/**
 * A new page is a text page unless another type is named, and only a text
 * page takes the content, the markdown source and the text format.
 */
export function draftJournalPage(spec: JournalPageSpec): JournalPageDraft {
  const type = spec.type ?? TEXT_PAGE_TYPE;
  const isText = type === TEXT_PAGE_TYPE;
  const options = withTextFormat(spec);
  return {
    name: spec.name,
    type,
    text: isText ? spec.content : undefined,
    src: spec.src,
    caption: options.caption,
    format: isText ? options.format : undefined,
    markdown: isText ? options.markdown : undefined,
    title: options.title,
    sort: options.sort,
    categoryId: options.categoryId,
    video: options.video
  };
}

/** The core renders a markdown page's HTML from its source, so a markdown source makes it a markdown page. */
export function withTextFormat<T extends JournalPageOptions>(options: T): T {
  if (options.markdown === undefined || options.format !== undefined) {
    return options;
  }
  return { ...options, format: 'markdown' };
}

/** The index entry of a page: what it is and which file it shows, without any of its text. */
export function toPageIndexEntry(page: JournalPageContent): JournalPageView {
  return { ...page, text: null, markdown: null, enrichedText: null };
}

export interface JournalShowTarget {
  readonly journalId: string;
  /** Show this page instead of the whole journal. */
  readonly pageId?: string | undefined;
}

export interface JournalAudience {
  /** Show to everyone, whatever their permission on the journal. */
  readonly force: boolean;
  /** User ids, handed to the core as given; left out, the journal goes to every connected player. */
  readonly users?: unknown;
}
