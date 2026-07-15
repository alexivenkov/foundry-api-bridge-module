import type {
  AddItemToActorCommand,
  GetPackContentsQuery,
  GetPackDocumentQuery,
  GetPackIndexQuery,
  ImportActorCommand,
  ImportDocumentCommand,
  ImportItemCommand,
  SearchAcrossPacksQuery,
  SearchInPackQuery,
  SearchJournalPagesQuery
} from '@/compendiums/application';
import type { PackContentsFilter, PackFieldFilter, PackSearchCriteria } from '@/compendiums/domain';
import type {
  AddItemFromCompendiumRequest,
  CreateActorFromCompendiumRequest,
  CreateItemFromCompendiumRequest,
  ImportFromCompendiumRequest
} from './importSchemas';
import type {
  GetCompendiumDocumentRequest,
  GetCompendiumIndexRequest,
  GetCompendiumRequest,
  SearchCompendiumPagesRequest,
  SearchCompendiumRequest,
  SearchCompendiumsRequest
} from './querySchemas';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export function toGetPackContentsQuery(request: GetCompendiumRequest): GetPackContentsQuery {
  const query: Mutable<GetPackContentsQuery> = { packId: request.packId };

  if (request.types !== undefined || request.ids !== undefined) {
    const filter: Mutable<PackContentsFilter> = {};
    if (request.types !== undefined) {
      filter.types = request.types;
    }
    if (request.ids !== undefined) {
      filter.ids = request.ids;
    }
    query.filter = filter;
  }

  return query;
}

export function toGetPackIndexQuery(request: GetCompendiumIndexRequest): GetPackIndexQuery {
  const query: Mutable<GetPackIndexQuery> = { packId: request.packId };
  if (request.fields !== undefined) {
    query.fields = request.fields;
  }
  return query;
}

export function toSearchInPackQuery(request: SearchCompendiumRequest): SearchInPackQuery {
  const criteria: Mutable<PackSearchCriteria> = {};
  if (request.query !== undefined) {
    criteria.query = request.query;
  }
  if (request.filters !== undefined) {
    criteria.filters = request.filters.map(
      (filter): PackFieldFilter => ({
        field: filter.field,
        operator: filter.operator ?? 'EQUALS',
        value: filter.value,
        negate: filter.negate ?? false
      })
    );
  }
  if (request.exclude !== undefined) {
    criteria.exclude = request.exclude;
  }
  if (request.fields !== undefined) {
    criteria.fields = request.fields;
  }

  const query: Mutable<SearchInPackQuery> = { packId: request.packId, criteria };
  if (request.limit !== undefined) {
    query.limit = request.limit;
  }
  if (request.offset !== undefined) {
    query.offset = request.offset;
  }
  return query;
}

export function toSearchAcrossPacksQuery(
  request: SearchCompendiumsRequest
): SearchAcrossPacksQuery {
  const query: Mutable<SearchAcrossPacksQuery> = { query: request.query };
  if (request.type !== undefined) {
    query.type = request.type;
  }
  if (request.system !== undefined) {
    query.system = request.system;
  }
  if (request.limit !== undefined) {
    query.limit = request.limit;
  }
  return query;
}

export function toSearchJournalPagesQuery(
  request: SearchCompendiumPagesRequest
): SearchJournalPagesQuery {
  const query: Mutable<SearchJournalPagesQuery> = { query: request.query };
  if (request.packIds !== undefined) {
    query.packIds = request.packIds;
  }
  if (request.pageTypes !== undefined) {
    query.pageTypes = request.pageTypes;
  }
  if (request.searchContent !== undefined) {
    query.searchContent = request.searchContent;
  }
  if (request.limit !== undefined) {
    query.limit = request.limit;
  }
  return query;
}

export function toGetPackDocumentQuery(
  request: GetCompendiumDocumentRequest
): GetPackDocumentQuery {
  return { packId: request.packId, documentId: request.documentId };
}

export function toImportDocumentCommand(
  request: ImportFromCompendiumRequest
): ImportDocumentCommand {
  const command: Mutable<ImportDocumentCommand> = {
    packId: request.packId,
    documentId: request.documentId
  };
  if (request.name !== undefined) {
    command.name = request.name;
  }
  if (request.folder !== undefined) {
    command.folder = request.folder;
  }
  return command;
}

export function toImportActorCommand(
  request: CreateActorFromCompendiumRequest
): ImportActorCommand {
  const command: Mutable<ImportActorCommand> = {
    packId: request.packId,
    actorId: request.actorId
  };
  if (request.name !== undefined) {
    command.name = request.name;
  }
  if (request.folder !== undefined) {
    command.folder = request.folder;
  }
  return command;
}

export function toImportItemCommand(
  request: CreateItemFromCompendiumRequest
): ImportItemCommand {
  const command: Mutable<ImportItemCommand> = {
    packId: request.packId,
    itemId: request.itemId
  };
  if (request.name !== undefined) {
    command.name = request.name;
  }
  if (request.folder !== undefined) {
    command.folder = request.folder;
  }
  return command;
}

export function toAddItemToActorCommand(
  request: AddItemFromCompendiumRequest
): AddItemToActorCommand {
  const command: Mutable<AddItemToActorCommand> = {
    actorId: request.actorId,
    packId: request.packId,
    itemId: request.itemId
  };
  if (request.name !== undefined) {
    command.name = request.name;
  }
  if (request.quantity !== undefined) {
    command.quantity = request.quantity;
  }
  return command;
}
