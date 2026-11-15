import type {
  DocumentQuery,
  GetFlagsQuery,
  ImportDocumentCommand,
  SetFlagCommand,
  SetOwnershipCommand,
  SortDocumentCommand,
  UnsetFlagCommand
} from '@/core/documents/application';
import { SEARCH_LIMIT_DEFAULT, type DocumentSearchQuery } from '@/core/documents/domain';
import { emptyAsAbsent } from '@/core/shared';
import type {
  DocumentUuidRequest,
  GetDocumentFlagsRequest,
  ImportDocumentRequest,
  SearchDocumentsRequest,
  SetDocumentFlagRequest,
  SetDocumentOwnershipRequest,
  SortDocumentRequest,
  UnsetDocumentFlagRequest
} from './documentSchemas';

export function toDocumentQuery(request: DocumentUuidRequest): DocumentQuery {
  return { uuid: request.uuid };
}

export function toSetOwnershipCommand(request: SetDocumentOwnershipRequest): SetOwnershipCommand {
  return {
    uuid: request.uuid,
    changes: {
      defaultLevel: request.defaultLevel,
      users: request.users !== undefined ? new Map(Object.entries(request.users)) : undefined
    }
  };
}

export function toGetFlagsQuery(request: GetDocumentFlagsRequest): GetFlagsQuery {
  return { uuid: request.uuid, scope: emptyAsAbsent(request.scope) };
}

export function toSetFlagCommand(request: SetDocumentFlagRequest): SetFlagCommand {
  return { uuid: request.uuid, scope: request.scope, key: request.key, value: request.value };
}

export function toUnsetFlagCommand(request: UnsetDocumentFlagRequest): UnsetFlagCommand {
  return { uuid: request.uuid, scope: request.scope, key: request.key };
}

export function toSortDocumentCommand(request: SortDocumentRequest): SortDocumentCommand {
  return { uuid: request.uuid, targetUuid: request.targetUuid, position: request.position };
}

export function toDocumentSearchQuery(request: SearchDocumentsRequest): DocumentSearchQuery {
  return {
    query: request.query,
    documentTypes: [...new Set(request.documentTypes ?? [])],
    source: request.source ?? 'all',
    limit: request.limit ?? SEARCH_LIMIT_DEFAULT
  };
}

export function toImportDocumentCommand(request: ImportDocumentRequest): ImportDocumentCommand {
  return { documentType: request.documentType, data: request.data, folderId: emptyAsAbsent(request.folderId) };
}
