import { foundryGeneration } from '@/compat/foundryVersion';
import {
  isLinkableDocumentType,
  type TableResultDraft,
  type TableResultKind,
  type TableResultReference,
  type TableResultWrite
} from '@/core/tables/domain';
import { toFoundryResultData } from './rollTableMapper';
import { resultTypeForCreate } from './tableResultTypes';

/** The pack's document type, which a compendium UUID names. */
export type PackDocumentTypeLookup = (packId: string) => string | undefined;

// Since Foundry 13 a result keeps a text row's text in `description`, a
// document row's label in `name`, and its target as `documentUuid` (verified
// against 13.351 and 14.368). The core migrates the pre-13 fields only on
// creation and only partly: a document row written as `text` without both
// `documentCollection` and `documentId` lands in `description` and loses its
// label, and an update without `type` builds no UUID at all. So from 13 on the
// current fields are written directly.

function writesCurrentFields(): boolean {
  return foundryGeneration() >= 13;
}

function currentType(kind: TableResultKind): string {
  return kind === 'text' ? 'text' : 'document';
}

/** `Actor.<id>` in the world, `Compendium.<pack>.<type>.<id>` in a pack (the older form without the type when the pack is unknown). */
export function referenceUuid(reference: TableResultReference, packDocumentType: PackDocumentTypeLookup): string {
  if (isLinkableDocumentType(reference.collection)) {
    return `${reference.collection}.${reference.id}`;
  }
  const documentType = packDocumentType(reference.collection);
  return documentType !== undefined
    ? `Compendium.${reference.collection}.${documentType}.${reference.id}`
    : `Compendium.${reference.collection}.${reference.id}`;
}

export function toFoundryResultCreateData(
  draft: TableResultDraft,
  packDocumentType: PackDocumentTypeLookup
): Record<string, unknown> {
  if (!writesCurrentFields()) {
    return toFoundryResultData(draft);
  }

  const data: Record<string, unknown> = {
    type: currentType(draft.kind),
    range: [...draft.range],
    weight: draft.weight
  };
  if (draft.kind === 'text') {
    data['description'] = draft.text;
  } else {
    data['name'] = draft.text;
  }
  if (draft.documentCollection !== undefined && draft.documentId !== undefined) {
    data['documentUuid'] = referenceUuid({ collection: draft.documentCollection, id: draft.documentId }, packDocumentType);
  }
  if (draft.img !== undefined) {
    data['img'] = draft.img;
  }
  return data;
}

function writeCurrentLabel(data: Record<string, unknown>, write: TableResultWrite): void {
  if (write.text === undefined) {
    return;
  }
  const [labelField, otherField] = write.kind === 'text' ? ['description', 'name'] : ['name', 'description'];
  data[labelField] = write.text;
  if (write.kindChanged) {
    data[otherField] = '';
  }
}

function writeLegacyFields(data: Record<string, unknown>, write: TableResultWrite): void {
  if (write.kindChanged) {
    data['type'] = resultTypeForCreate(write.kind);
  }
  if (write.text !== undefined) {
    data['text'] = write.text;
  }
  if (write.reference === null) {
    data['documentCollection'] = '';
    data['documentId'] = null;
  } else if (write.reference !== undefined) {
    data['documentCollection'] = write.reference.collection;
    data['documentId'] = write.reference.id;
  }
}

/** The embedded update of one row: only what the write sets, under the row's `_id`. */
export function toFoundryResultUpdate(
  resultId: string,
  write: TableResultWrite,
  packDocumentType: PackDocumentTypeLookup
): Record<string, unknown> {
  const data: Record<string, unknown> = { _id: resultId };

  if (writesCurrentFields()) {
    if (write.kindChanged) {
      data['type'] = currentType(write.kind);
    }
    writeCurrentLabel(data, write);
    if (write.reference !== undefined) {
      data['documentUuid'] = write.reference === null ? null : referenceUuid(write.reference, packDocumentType);
    }
  } else {
    writeLegacyFields(data, write);
  }

  if (write.range !== undefined) {
    data['range'] = [...write.range];
  }
  if (write.weight !== undefined) {
    data['weight'] = write.weight;
  }
  if (write.drawn !== undefined) {
    data['drawn'] = write.drawn;
  }
  if (write.img !== undefined) {
    data['img'] = write.img;
  }
  return data;
}
