import type { JournalPageFormat } from '@/core/journals/domain';

// CONST.JOURNAL_ENTRY_PAGE_FORMATS, identical in 13.351 and 14.368.
const FORMAT_CODES: Readonly<Record<JournalPageFormat, number>> = { html: 1, markdown: 2 };

export function toFoundryPageFormat(format: JournalPageFormat): number {
  return FORMAT_CODES[format];
}

/** The schema's initial value is HTML, so a page without a known code reads as HTML. */
export function fromFoundryPageFormat(code: number | undefined): JournalPageFormat {
  return code === FORMAT_CODES.markdown ? 'markdown' : 'html';
}
