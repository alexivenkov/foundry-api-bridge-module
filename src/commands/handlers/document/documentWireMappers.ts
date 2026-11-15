import type {
  DocumentOwnershipResult,
  DocumentReference as WireDocumentReference,
  DocumentSearchHit as WireDocumentSearchHit,
  ExportDocumentResult,
  GetDocumentFlagsResult,
  ImportDocumentResult,
  SearchDocumentsResult,
  SetDocumentFlagResult,
  SortDocumentResult,
  UnsetDocumentFlagResult
} from '@/commands/types';
import type {
  DocumentFlagRemoval,
  DocumentFlagValue,
  DocumentFlags,
  DocumentOwnership,
  DocumentReference,
  DocumentSearchHit,
  DocumentSearchResult,
  DocumentSortResult,
  ExportedDocument,
  ImportedDocument
} from '@/core/documents';

export function toWireDocumentReference(document: DocumentReference): WireDocumentReference {
  return {
    uuid: document.uuid,
    documentType: document.documentType,
    id: document.id,
    name: document.name,
    packId: document.packId,
    parentUuid: document.parentUuid
  };
}

export function toWireOwnership(ownership: DocumentOwnership): DocumentOwnershipResult {
  return {
    ...toWireDocumentReference(ownership.document),
    defaultLevel: ownership.defaultLevel,
    users: ownership.users.map((user) => ({ userId: user.userId, userName: user.userName, level: user.level }))
  };
}

export function toWireFlags(flags: DocumentFlags): GetDocumentFlagsResult {
  return { ...toWireDocumentReference(flags.document), scope: flags.scope, flags: { ...flags.flags } };
}

export function toWireFlagValue(flag: DocumentFlagValue): SetDocumentFlagResult {
  return { ...toWireDocumentReference(flag.document), scope: flag.scope, key: flag.key, value: flag.value };
}

export function toWireFlagRemoval(removal: DocumentFlagRemoval): UnsetDocumentFlagResult {
  return {
    ...toWireDocumentReference(removal.document),
    unset: true,
    scope: removal.scope,
    key: removal.key,
    existed: removal.existed
  };
}

export function toWireSortResult(result: DocumentSortResult): SortDocumentResult {
  return {
    ...toWireDocumentReference(result.document),
    sort: result.sort,
    targetUuid: result.targetUuid,
    position: result.position
  };
}

function toWireSearchHit(hit: DocumentSearchHit): WireDocumentSearchHit {
  return {
    uuid: hit.uuid,
    id: hit.id,
    name: hit.name,
    documentType: hit.documentType,
    subtype: hit.subtype,
    packId: hit.packId,
    folderId: hit.folderId,
    parentUuid: hit.parentUuid
  };
}

export function toWireSearchResult(result: DocumentSearchResult): SearchDocumentsResult {
  return { query: result.query, results: result.results.map(toWireSearchHit) };
}

export function toWireExport(exported: ExportedDocument): ExportDocumentResult {
  return { ...toWireDocumentReference(exported.document), data: { ...exported.data } };
}

export function toWireImport(imported: ImportedDocument): ImportDocumentResult {
  return { ...toWireDocumentReference(imported.document), folderId: imported.folderId };
}
