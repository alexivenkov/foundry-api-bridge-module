import type {
  RollTable,
  RollTableChanges,
  RollTableDraft,
  RollTableOverview,
  TableDraw,
  TableResult,
  TableResultDraft
} from '@/core/tables/domain';
import type {
  FoundryRollTableDocument,
  FoundryRollTableDraw,
  FoundryTableResultDocument
} from './foundryRollTableTypes';
import { parseDocumentReference } from './documentReference';
import { currentResultKind, legacyResultKind, resultTypeForCreate } from './tableResultTypes';

type ResultReading = Pick<TableResult, 'kind' | 'text' | 'documentCollection' | 'documentId'>;

/** Reads the fields Foundry 13 introduced and leaves the deprecated accessors alone. */
function readCurrentFields(document: FoundryTableResultDocument): ResultReading {
  const reference = parseDocumentReference(document.documentUuid);
  return {
    kind: currentResultKind(document.type, reference?.inCompendium === true),
    text: (document.type === 'text' ? document.description : document.name) ?? '',
    documentCollection: reference?.collection ?? null,
    documentId: reference?.id ?? null
  };
}

function readLegacyFields(document: FoundryTableResultDocument): ResultReading {
  return {
    kind: legacyResultKind(document.type),
    text: document.text ?? document.name ?? '',
    documentCollection: document.documentCollection ?? null,
    documentId: document.documentId ?? null
  };
}

export function toTableResult(document: FoundryTableResultDocument): TableResult {
  // `description` exists on every result since Foundry 13 and on none before.
  const reading = document.description !== undefined ? readCurrentFields(document) : readLegacyFields(document);
  return {
    id: document._id,
    kind: reading.kind,
    text: reading.text,
    img: document.img ?? '',
    range: document.range,
    weight: document.weight,
    drawn: document.drawn,
    documentCollection: reading.documentCollection,
    documentId: reading.documentId
  };
}

export function toRollTable(document: FoundryRollTableDocument): RollTable {
  return {
    id: document.id,
    name: document.name,
    img: document.img ?? '',
    description: document.description ?? '',
    formula: document.formula,
    replacement: document.replacement,
    displayRoll: document.displayRoll,
    results: document.results.contents.map(toTableResult),
    folderId: document.folder === undefined ? undefined : (document.folder?.id ?? null)
  };
}

/** Counts the rows without mapping them: a listing does not need them. */
export function toRollTableOverview(document: FoundryRollTableDocument): RollTableOverview {
  const results = document.results.contents;
  return {
    id: document.id,
    name: document.name,
    img: document.img ?? '',
    description: document.description ?? '',
    formula: document.formula,
    replacement: document.replacement,
    totalResults: results.length,
    drawnResults: results.filter((result) => result.drawn).length
  };
}

export function toTableDraw(draw: FoundryRollTableDraw): TableDraw {
  return {
    formula: draw.roll.formula,
    total: draw.roll.total,
    results: draw.results.map(toTableResult)
  };
}

/** `RollTable#drawMany` reports one pool roll; the separate rolls sit in its first term. */
export function toMultipleTableDraw(draw: FoundryRollTableDraw): TableDraw {
  const rolls = draw.roll.terms?.[0]?.rolls ?? [];
  return {
    ...toTableDraw(draw),
    rolls: rolls.map((roll) => ({ formula: roll.formula, total: roll.total }))
  };
}

/** A result in the shape every Foundry version migrates on creation; see `tableResultTypes`. */
export function toFoundryResultData(draft: TableResultDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {
    type: resultTypeForCreate(draft.kind),
    text: draft.text,
    range: [...draft.range],
    weight: draft.weight
  };

  if (draft.img !== undefined) {
    data['img'] = draft.img;
  }
  if (draft.documentCollection !== undefined) {
    data['documentCollection'] = draft.documentCollection;
  }
  if (draft.documentId !== undefined) {
    data['documentId'] = draft.documentId;
  }

  return data;
}

export function toFoundryRollTableData(draft: RollTableDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {
    name: draft.name,
    formula: draft.formula,
    replacement: draft.replacement,
    displayRoll: draft.displayRoll
  };

  if (draft.description !== undefined) {
    data['description'] = draft.description;
  }
  if (draft.img !== undefined) {
    data['img'] = draft.img;
  }
  if (draft.folderId !== undefined) {
    data['folder'] = draft.folderId;
  }
  if (draft.results !== undefined) {
    data['results'] = draft.results.map(toFoundryResultData);
  }

  return data;
}

const CHANGEABLE_FIELDS = ['name', 'formula', 'replacement', 'displayRoll', 'description', 'img'] as const;

/** Only the attributes that are set become document fields, so an update stays a partial update. */
export function toFoundryRollTableChanges(changes: RollTableChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const field of CHANGEABLE_FIELDS) {
    if (changes[field] !== undefined) {
      data[field] = changes[field];
    }
  }
  if (changes.folderId !== undefined) {
    data['folder'] = changes.folderId;
  }

  return data;
}
