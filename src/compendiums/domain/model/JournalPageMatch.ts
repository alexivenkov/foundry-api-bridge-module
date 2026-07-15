export interface JournalPageMatch {
  readonly packId: string;
  readonly packLabel: string;
  readonly journalId: string;
  readonly journalName: string;
  readonly pageId: string;
  readonly pageName: string;
  readonly pageType: string;
  readonly uuid: string;
  readonly matchedIn: 'name' | 'content';
  readonly snippet: string | null;
}
