import type { DocumentReference } from '@/core/documents/domain';
import type { FoundryDocument } from './foundryDocumentTypes';

export function toDocumentReference(document: FoundryDocument): DocumentReference {
  return {
    uuid: document.uuid,
    documentType: document.documentName,
    id: document.id ?? '',
    name: typeof document.name === 'string' ? document.name : null,
    packId: typeof document.pack === 'string' ? document.pack : null,
    parentUuid: document.parent?.uuid ?? null
  };
}

/** A detached plain-JSON copy, so nothing handed out aliases the live document source. */
export function toPlainRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return {};
  }
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function sourceString(document: FoundryDocument, field: string): string | null {
  const value = document._source[field];
  return typeof value === 'string' && value.length > 0 ? value : null;
}
