import type { NameNeedle } from './NameNeedle';

const SNIPPET_RADIUS = 100;

// `&amp;` is decoded LAST so escaped sequences like `&amp;lt;` come out as
// the literal `&lt;` instead of being double-decoded into `<`.
const BASIC_ENTITIES: ReadonlyArray<readonly [RegExp, string]> = [
  [/&nbsp;/g, ' '],
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
  [/&amp;/g, '&']
];

// Good-enough HTML flattening for search: tags become spaces, the handful of
// entities Foundry's editor emits are decoded, whitespace collapses.
export function stripHtml(html: string): string {
  let text = html.replace(/<[^>]*>/g, ' ');
  for (const [entity, replacement] of BASIC_ENTITIES) {
    text = text.replace(entity, replacement);
  }
  return text.replace(/\s+/g, ' ').trim();
}

export function findSnippet(plainText: string, needle: string, radius = SNIPPET_RADIUS): string | null {
  const index = plainText.toLowerCase().indexOf(needle);
  if (index === -1) {
    return null;
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(plainText.length, index + needle.length + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < plainText.length ? '…' : '';
  return `${prefix}${plainText.slice(start, end).trim()}${suffix}`;
}

export interface PageMatchOutcome {
  readonly matchedIn: 'name' | 'content';
  readonly snippet: string | null;
}

// A name match wins (no snippet needed); content is scanned only when
// requested and only when the name did not already match.
export function matchJournalPage(
  needle: NameNeedle,
  page: { readonly name: string; readonly text: string | null },
  searchContent: boolean
): PageMatchOutcome | null {
  if (needle.matches(page.name)) {
    return { matchedIn: 'name', snippet: null };
  }
  if (!searchContent || page.text === null) {
    return null;
  }

  const snippet = findSnippet(stripHtml(page.text), needle.value);
  return snippet !== null ? { matchedIn: 'content', snippet } : null;
}
