import {
  EmptyFolderError,
  NotARollTableFolderError,
  TableDrawCountError,
  TableFolderNotFoundError,
  TableFormulaError,
  TableResultReferenceError,
  UndrawableFolderError
} from '@/core/tables/domain/errors/tableOperationErrors';
import type { TableResult, TableResultDraft, TableResultKind } from '@/core/tables/domain/model/RollTable';
import {
  TABLE_LINKABLE_DOCUMENT_TYPES,
  type TableFolder,
  type TableResultChanges,
  type TableResultReference,
  type TableResultWrite
} from '@/core/tables/domain/model/TableOperations';

// Every draw rolls on the GM's main thread, and the core rerolls until a row
// is hit — up to 10 000 times per draw when the ranges leave gaps.
export const MAX_TABLE_DRAWS = 100;
export const MAX_TABLE_FORMULA_LENGTH = 200;
export const MAX_TABLE_FORMULA_DICE = 100;

export function assertDrawCount(count: number): void {
  if (!Number.isInteger(count) || count < 1 || count > MAX_TABLE_DRAWS) {
    throw new TableDrawCountError(count, MAX_TABLE_DRAWS);
  }
}

/** The formula as it will be rolled. A table roll carries no roll data, so an `@` reference could only roll as 0. */
export function parseTableFormula(raw: string): string {
  const formula = raw.trim();
  if (formula === '') {
    throw new TableFormulaError('it is empty');
  }
  if (formula.length > MAX_TABLE_FORMULA_LENGTH) {
    throw new TableFormulaError(
      `it is ${String(formula.length)} characters long, at most ${String(MAX_TABLE_FORMULA_LENGTH)} are allowed`
    );
  }
  if (formula.includes('@')) {
    throw new TableFormulaError('a table roll has no roll data for @ references');
  }
  return formula;
}

export function assertFormulaDice(dice: number): void {
  if (dice > MAX_TABLE_FORMULA_DICE) {
    throw new TableFormulaError(`it rolls ${String(dice)} dice, at most ${String(MAX_TABLE_FORMULA_DICE)} are allowed`);
  }
}

export function assertRollTableFolder(folder: TableFolder | null, folderId: string): TableFolder {
  if (folder === null) {
    throw new TableFolderNotFoundError(folderId);
  }
  if (folder.type !== 'RollTable') {
    throw new NotARollTableFolderError(folderId, folder.type);
  }
  return folder;
}

/** A folder whose direct contents can become the rows of a new table. */
export function assertTableSourceFolder(folder: TableFolder | null, folderId: string): TableFolder {
  if (folder === null) {
    throw new TableFolderNotFoundError(folderId);
  }
  if (!isLinkableDocumentType(folder.type)) {
    throw new UndrawableFolderError(folderId, folder.type);
  }
  if (folder.documentCount === 0) {
    throw new EmptyFolderError(folderId);
  }
  return folder;
}

export function isLinkableDocumentType(type: string): boolean {
  return (TABLE_LINKABLE_DOCUMENT_TYPES as readonly string[]).includes(type);
}

/** Where a row's reference points: a world document type, an installed pack, or nothing known. */
export type TableReferenceScope = 'world' | 'compendium';

export function draftReference(draft: TableResultDraft): TableResultReference | null {
  const { documentCollection: collection, documentId: id } = draft;
  if ((collection === undefined) !== (id === undefined)) {
    throw new TableResultReferenceError('documentCollection and documentId must be given together');
  }
  if (collection === undefined || id === undefined) {
    return null;
  }
  if (draft.kind === 'text') {
    throw new TableResultReferenceError('A text result cannot reference a document; make it a document or compendium result');
  }
  return { collection, id };
}

export function assertReferenceScope(
  kind: TableResultKind,
  reference: TableResultReference,
  scope: TableReferenceScope | null
): void {
  if (scope === null) {
    throw new TableResultReferenceError(
      `Unknown document collection: ${reference.collection} (neither a world document type nor an installed compendium pack)`
    );
  }
  if (kind === 'document' && scope === 'compendium') {
    throw new TableResultReferenceError(
      `A document result points to a world document; ${reference.collection} is a compendium pack, so make it a compendium result`
    );
  }
  if (kind === 'compendium' && scope === 'world') {
    throw new TableResultReferenceError(
      `A compendium result points into a pack; ${reference.collection} is a world document type, so make it a document result`
    );
  }
}

function currentReference(result: TableResult): TableResultReference | null {
  return result.documentCollection !== null && result.documentId !== null
    ? { collection: result.documentCollection, id: result.documentId }
    : null;
}

export interface ResolvedResultChange {
  readonly write: TableResultWrite;
  /** The reference the row holds afterwards, to be checked when it is new or the kind changed; null for none. */
  readonly reference: TableResultReference | null;
  readonly referenceToCheck: boolean;
}

/**
 * Resolves a partial change against the row as it is. A row that becomes a
 * text row drops its reference; a row that changes kind takes its label along,
 * because the core keeps the label of a text row and of a document row in
 * different fields.
 */
export function resolveResultChange(current: TableResult, changes: TableResultChanges): ResolvedResultChange {
  const kind = changes.kind ?? current.kind;
  const kindChanged = kind !== current.kind;
  const existing = currentReference(current);

  if (kind === 'text' && changes.reference !== undefined && changes.reference !== null) {
    throw new TableResultReferenceError('A text result cannot reference a document; make it a document or compendium result');
  }

  let reference: TableResultReference | null | undefined = changes.reference;
  if (reference === undefined && kind === 'text' && existing !== null && kindChanged) {
    reference = null;
  }
  const after = reference !== undefined ? reference : existing;
  const text = changes.text ?? (kindChanged ? current.text : undefined);

  return {
    write: {
      kind,
      kindChanged,
      text,
      range: changes.range,
      weight: changes.weight,
      drawn: changes.drawn,
      img: changes.img,
      reference
    },
    reference: after,
    referenceToCheck: after !== null && kind !== 'text' && (reference !== undefined || kindChanged)
  };
}
