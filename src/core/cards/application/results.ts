import type { Card, CardMove, CardStackSummary } from '@/core/cards/domain';

export interface CardStackDeletionResult {
  readonly stackId: string;
  readonly moved: readonly CardMove[];
}

export interface CardResult {
  readonly stackId: string;
  readonly card: Card;
}

export interface CardDeletionResult {
  readonly stackId: string;
  readonly cardId: string;
}

export interface CardOperationResult {
  readonly moved: readonly CardMove[];
  /** Every stack involved, as the operation left it. */
  readonly stacks: readonly CardStackSummary[];
}

export interface ShownCardResult {
  readonly stackId: string;
  readonly cardId: string;
  readonly messageId: string;
}
