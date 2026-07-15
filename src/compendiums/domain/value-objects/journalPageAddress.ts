// Foundry's embedded-document addressing scheme: a page UUID is the parent
// journal UUID extended with the embedded collection segment.
export function journalPageUuid(journalUuid: string, pageId: string): string {
  return `${journalUuid}.JournalEntryPage.${pageId}`;
}
