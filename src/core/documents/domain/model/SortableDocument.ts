import type { DocumentReference } from './DocumentReference';

export const SORT_POSITIONS = ['before', 'after'] as const;
export type SortPosition = (typeof SORT_POSITIONS)[number];

/**
 * A document as the sort command sees it. `container` identifies the set of siblings it is sorted among (its folder,
 * or its parent document) and is null for a type without a sort order.
 */
export interface SortableDocument {
  readonly document: DocumentReference;
  readonly sort: number;
  readonly container: string | null;
}

export interface DocumentSortResult {
  readonly document: DocumentReference;
  readonly sort: number;
  readonly targetUuid: string;
  readonly position: SortPosition;
}
