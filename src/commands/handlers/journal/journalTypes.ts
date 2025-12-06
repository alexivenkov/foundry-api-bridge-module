import type { JournalPageResult, JournalResult } from '@/commands/types';

export interface FoundryJournalPage {
  id: string;
  name: string;
  type: string;
  update(data: FoundryPageUpdateData): Promise<FoundryJournalPage>;
}

export interface FoundryPageUpdateData {
  name?: string;
  text?: {
    content?: string;
  };
}

export interface FoundryPagesCollection {
  get(id: string): FoundryJournalPage | undefined;
  map<T>(callback: (page: FoundryJournalPage) => T): T[];
}

export interface FoundryJournalEntry {
  id: string;
  name: string;
  folder: { id: string } | null;
  pages: FoundryPagesCollection;
  update(data: FoundryJournalUpdateData): Promise<FoundryJournalEntry>;
  delete(): Promise<FoundryJournalEntry>;
  createEmbeddedDocuments(
    type: 'JournalEntryPage',
    data: FoundryPageCreateData[]
  ): Promise<FoundryJournalPage[]>;
  deleteEmbeddedDocuments(type: 'JournalEntryPage', ids: string[]): Promise<unknown[]>;
}

export interface FoundryJournalUpdateData {
  name?: string;
  folder?: string | null;
}

export interface FoundryPageCreateData {
  name: string;
  type: string;
  text?: {
    content: string;
  };
}

export interface FoundryJournalCreateData {
  name: string;
  folder?: string | null;
  pages?: FoundryPageCreateData[];
}

export interface JournalEntryConstructor {
  create(data: FoundryJournalCreateData): Promise<FoundryJournalEntry>;
}

export interface FoundryJournalCollection {
  get(id: string): FoundryJournalEntry | undefined;
}

export interface FoundryGame {
  journal: FoundryJournalCollection;
}

export function mapJournalToResult(journal: FoundryJournalEntry): JournalResult {
  return {
    id: journal.id,
    name: journal.name,
    folder: journal.folder?.id ?? null,
    pages: journal.pages.map(mapPageToResult)
  };
}

export function mapPageToResult(page: FoundryJournalPage): JournalPageResult {
  return {
    id: page.id,
    name: page.name,
    type: page.type
  };
}