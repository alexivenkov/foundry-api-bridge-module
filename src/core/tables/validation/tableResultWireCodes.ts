import type { TableResultKind } from '@/core/tables/domain';

// On the wire a result's type is the number Foundry used up to version 11. It
// is part of the wire contract and kept apart from what the core stores today.

const KIND_BY_WIRE_CODE: Readonly<Record<number, TableResultKind>> = { 0: 'text', 1: 'document', 2: 'compendium' };
const WIRE_CODE: Readonly<Record<TableResultKind, number>> = { text: 0, document: 1, compendium: 2 };

/**
 * An omitted type is text. A number outside 0–2 is not rejected — the command
 * never checked it — and reads as a document reference, the way the core's own
 * migration from numbers treats everything but 0.
 */
export function tableResultKindFromWireCode(code: number | null | undefined): TableResultKind {
  if (code === undefined || code === null) {
    return 'text';
  }
  return KIND_BY_WIRE_CODE[code] ?? 'document';
}

export function tableResultKindToWireCode(kind: TableResultKind): number {
  return WIRE_CODE[kind];
}
