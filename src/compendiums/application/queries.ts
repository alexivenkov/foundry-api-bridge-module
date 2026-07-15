import type { PackContentsFilter, PackSearchCriteria } from '@/compendiums/domain';

export interface GetPackContentsQuery {
  readonly packId: string;
  readonly filter?: PackContentsFilter;
}

export interface GetPackIndexQuery {
  readonly packId: string;
  readonly fields?: readonly string[];
}

export interface SearchInPackQuery {
  readonly packId: string;
  readonly criteria: PackSearchCriteria;
  readonly limit?: number;
  readonly offset?: number;
}

export interface SearchAcrossPacksQuery {
  readonly query: string;
  readonly type?: string;
  readonly system?: string;
  readonly limit?: number;
}

export interface GetPackDocumentQuery {
  readonly packId: string;
  readonly documentId: string;
}

export interface SearchJournalPagesQuery {
  readonly query: string;
  readonly packIds?: readonly string[];
  readonly pageTypes?: readonly string[];
  readonly searchContent?: boolean;
  readonly limit?: number;
}

export interface ImportDocumentCommand {
  readonly packId: string;
  readonly documentId: string;
  readonly name?: string;
  readonly folder?: string;
}

export interface ImportActorCommand {
  readonly packId: string;
  readonly actorId: string;
  readonly name?: string;
  readonly folder?: string;
}

export interface ImportItemCommand {
  readonly packId: string;
  readonly itemId: string;
  readonly name?: string;
  readonly folder?: string;
}

export interface AddItemToActorCommand {
  readonly actorId: string;
  readonly packId: string;
  readonly itemId: string;
  readonly name?: string;
  readonly quantity?: number;
}
