export interface HeldCard {
  readonly id: string;
  readonly name: string;
}

/** The cards a stack holds: a deck's cards that are not out, every card of a hand or a pile. */
export interface StackHoldings {
  readonly stackId: string;
  readonly cards: readonly HeldCard[];
}

export interface CardMove {
  readonly cardId: string;
  readonly name: string;
  /** null when no stack held the card before. */
  readonly fromStackId: string | null;
  /** null when no stack holds it now. */
  readonly toStackId: string | null;
}

function heldIds(holdings: readonly StackHoldings[]): Map<string, Set<string>> {
  return new Map(holdings.map((stack) => [stack.stackId, new Set(stack.cards.map((card) => card.id))]));
}

/**
 * What moved between two readings of the stacks. The core keeps a card's id
 * when it moves the card, so a card that one stack gained is matched with the
 * stack that lost the same id. `sourceStackId` names where cards came from when
 * no stack lost them — a deck passing its own cards to another deck keeps them.
 */
export function diffCardMoves(
  before: readonly StackHoldings[],
  after: readonly StackHoldings[],
  sourceStackId?: string
): CardMove[] {
  const heldBefore = heldIds(before);
  const heldAfter = heldIds(after);

  const departures = new Map<string, { name: string; stackIds: string[] }>();
  for (const stack of before) {
    const stillHeld = heldAfter.get(stack.stackId) ?? new Set<string>();
    for (const card of stack.cards) {
      if (stillHeld.has(card.id)) {
        continue;
      }
      const departure = departures.get(card.id) ?? { name: card.name, stackIds: [] };
      departure.stackIds.push(stack.stackId);
      departures.set(card.id, departure);
    }
  }

  const moves: CardMove[] = [];
  for (const stack of after) {
    const wasHeld = heldBefore.get(stack.stackId) ?? new Set<string>();
    for (const card of stack.cards) {
      if (wasHeld.has(card.id)) {
        continue;
      }
      const fallback = sourceStackId !== undefined && sourceStackId !== stack.stackId ? sourceStackId : null;
      const fromStackId = departures.get(card.id)?.stackIds.shift() ?? fallback;
      moves.push({ cardId: card.id, name: card.name, fromStackId, toStackId: stack.stackId });
    }
  }

  for (const [cardId, departure] of departures) {
    for (const stackId of departure.stackIds) {
      moves.push({ cardId, name: departure.name, fromStackId: stackId, toStackId: null });
    }
  }
  return moves;
}

/** The stacks a result reports: the named ones first, then every other stack a card moved from or to. */
export function involvedStackIds(named: readonly string[], moves: readonly CardMove[]): string[] {
  const ids = new Set(named);
  for (const move of moves) {
    if (move.fromStackId !== null) {
      ids.add(move.fromStackId);
    }
    if (move.toStackId !== null) {
      ids.add(move.toStackId);
    }
  }
  return [...ids];
}
