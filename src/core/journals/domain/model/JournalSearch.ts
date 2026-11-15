export type JournalSearchMatchedIn = 'journal' | 'name' | 'content';

export interface JournalSearchMatch {
  readonly journalId: string;
  readonly journalName: string;
  readonly pageId: string | null;
  readonly pageName: string | null;
  readonly pageType: string | null;
  readonly uuid: string;
  readonly matchedIn: JournalSearchMatchedIn;
  readonly snippet: string | null;
}

export interface JournalSearchPage {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  /** HTML, as stored. */
  readonly text: string | null;
  readonly markdown: string | null;
}

export interface JournalSearchSource {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly pages: readonly JournalSearchPage[];
}

export interface JournalSearchCriteria {
  readonly query: string;
  /** Only pages of these types; journal-name matches are then left out. */
  readonly pageTypes?: readonly string[] | undefined;
  readonly searchContent: boolean;
  readonly limit: number;
  readonly offset: number;
}

export interface JournalSearchOutcome {
  readonly matches: readonly JournalSearchMatch[];
  readonly hasMore: boolean;
}

export const JOURNAL_SEARCH_DEFAULT_LIMIT = 25;
export const JOURNAL_SEARCH_MAX_LIMIT = 200;
const SNIPPET_RADIUS = 100;

// `&amp;` goes last, so an escaped `&amp;lt;` comes out as the text `&lt;`.
const ENTITIES: ReadonlyArray<readonly [RegExp, string]> = [
  [/&nbsp;/g, ' '],
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&quot;/g, '"'],
  [/&#0?39;/g, "'"],
  [/&amp;/g, '&']
];

/** Plain text of stored HTML for searching: tags become spaces, the editor's entities are decoded. */
export function htmlToSearchText(html: string): string {
  let text = html.replace(/<[^>]*>/g, ' ');
  for (const [entity, replacement] of ENTITIES) {
    text = text.replace(entity, replacement);
  }
  return text.replace(/\s+/g, ' ').trim();
}

/** The text around the first occurrence of the lower-cased needle, or null when it does not occur. */
export function snippetAround(text: string, needle: string, radius = SNIPPET_RADIUS): string | null {
  const index = text.toLowerCase().indexOf(needle);
  if (index === -1) {
    return null;
  }
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + needle.length + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

export function journalPageUuid(journalUuid: string, pageId: string): string {
  return `${journalUuid}.JournalEntryPage.${pageId}`;
}

function pageSearchText(page: JournalSearchPage): string | null {
  if (page.text !== null && page.text !== '') {
    return htmlToSearchText(page.text);
  }
  return page.markdown !== null && page.markdown !== '' ? page.markdown.replace(/\s+/g, ' ').trim() : null;
}

function matchPage(
  journal: JournalSearchSource,
  page: JournalSearchPage,
  needle: string,
  searchContent: boolean
): JournalSearchMatch | null {
  const base = {
    journalId: journal.id,
    journalName: journal.name,
    pageId: page.id,
    pageName: page.name,
    pageType: page.type,
    uuid: journalPageUuid(journal.uuid, page.id)
  };
  if (page.name.toLowerCase().includes(needle)) {
    return { ...base, matchedIn: 'name', snippet: null };
  }
  if (!searchContent) {
    return null;
  }
  const text = pageSearchText(page);
  const snippet = text !== null ? snippetAround(text, needle) : null;
  return snippet !== null ? { ...base, matchedIn: 'content', snippet } : null;
}

function* journalMatches(
  journals: readonly JournalSearchSource[],
  needle: string,
  criteria: JournalSearchCriteria
): Generator<JournalSearchMatch> {
  for (const journal of journals) {
    if (criteria.pageTypes === undefined && journal.name.toLowerCase().includes(needle)) {
      yield {
        journalId: journal.id,
        journalName: journal.name,
        pageId: null,
        pageName: null,
        pageType: null,
        uuid: journal.uuid,
        matchedIn: 'journal',
        snippet: null
      };
    }
    for (const page of journal.pages) {
      if (criteria.pageTypes !== undefined && !criteria.pageTypes.includes(page.type)) {
        continue;
      }
      const match = matchPage(journal, page, needle, criteria.searchContent);
      if (match !== null) {
        yield match;
      }
    }
  }
}

/**
 * Case-insensitive substring search in the order the journals and pages come.
 * A journal's name is one match; a page matches by its name before its text.
 * The scan stops as soon as it knows whether a further page of results exists.
 */
export function searchJournals(
  journals: readonly JournalSearchSource[],
  criteria: JournalSearchCriteria
): JournalSearchOutcome {
  const needle = criteria.query.trim().toLowerCase();
  const matches: JournalSearchMatch[] = [];
  if (needle === '') {
    return { matches, hasMore: false };
  }
  let skipped = 0;
  for (const match of journalMatches(journals, needle, criteria)) {
    if (skipped < criteria.offset) {
      skipped += 1;
      continue;
    }
    if (matches.length === criteria.limit) {
      return { matches, hasMore: true };
    }
    matches.push(match);
  }
  return { matches, hasMore: false };
}
