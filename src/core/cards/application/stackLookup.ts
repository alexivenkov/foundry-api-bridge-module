import {
  CardNotFoundError,
  CardStackNotFoundError,
  type Card,
  type CardStack,
  type CardStackStore,
  type CardStackSummary
} from '@/core/cards/domain';

export function requireStack(stacks: CardStackStore, stackId: string): CardStack {
  const stack = stacks.findStack(stackId);
  if (stack === null) {
    throw new CardStackNotFoundError(stackId);
  }
  return stack;
}

export function requireCard(stack: CardStack, cardId: string): Card {
  const card = stack.cards.find((candidate) => candidate.id === cardId);
  if (card === undefined) {
    throw new CardNotFoundError(stack.id, cardId);
  }
  return card;
}

/** The summaries of the given stacks, in the given order; a stack that is gone is left out. */
export function summarize(stacks: CardStackStore, stackIds: readonly string[]): CardStackSummary[] {
  const byId = new Map(stacks.listStacks().map((stack) => [stack.id, stack]));
  return stackIds.flatMap((id) => {
    const stack = byId.get(id);
    return stack !== undefined ? [stack] : [];
  });
}
