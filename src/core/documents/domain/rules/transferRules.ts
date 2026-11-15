import {
  DocumentTypeNotTransferableError,
  ScriptImportDisabledError
} from '@/core/documents/domain/errors/documentErrors';
import {
  TRANSFERABLE_DOCUMENT_TYPES,
  type ScriptContentKind,
  type TransferableDocumentType
} from '@/core/documents/domain/model/DocumentTransfer';
import type { ScriptContentPolicy } from '@/core/documents/domain/ports/ports';

/**
 * Below the 16 MiB frame limit of both servers, so an export never closes the connection; an envelope and the
 * escaping of a string payload fit in the rest.
 */
export const DOCUMENT_TRANSFER_MAX_BYTES = 8 * 1024 * 1024;

export function isTransferableDocumentType(documentType: string): documentType is TransferableDocumentType {
  return (TRANSFERABLE_DOCUMENT_TYPES as readonly string[]).includes(documentType);
}

export function requireTransferableDocumentType(documentType: string): TransferableDocumentType {
  if (!isTransferableDocumentType(documentType)) {
    throw new DocumentTypeNotTransferableError(documentType, TRANSFERABLE_DOCUMENT_TYPES);
  }
  return documentType;
}

/** Imported data that runs JavaScript needs the same opt-in as a script macro created through the API. */
export function requireScriptImportAllowed(found: readonly ScriptContentKind[], policy: ScriptContentPolicy): void {
  if (found.length > 0 && !policy.allowsScripts()) {
    throw new ScriptImportDisabledError([...new Set(found)]);
  }
}
