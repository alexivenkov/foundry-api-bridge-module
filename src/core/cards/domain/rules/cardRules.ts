import {
  CardAlreadyDrawnError,
  CardAlreadyInStackError,
  CardCannotEnterDeckError,
  CardFaceOutOfRangeError,
  NoNextCardFaceError,
  NoPreviousCardFaceError,
  NotEnoughCardsError,
  SameCardStackError
} from '@/core/cards/domain/errors/cardErrors';
import {
  isDeck,
  type Card,
  type CardChanges,
  type CardDraft,
  type CardFlipTarget,
  type CardStack,
  type CardStackSummary
} from '@/core/cards/domain/model/Card';

/** The core draws from the top of a stack by ascending sort; equal sorts keep the stack's own order. */
export function orderFromTop<T extends { readonly sort: number }>(cards: readonly T[]): T[] {
  return [...cards].sort((a, b) => a.sort - b.sort);
}

/** A card shows a face only while its face index names one of its faces. */
export function isFaceUp(face: number | null, faceCount: number): boolean {
  return face !== null && face >= 0 && face < faceCount;
}

export function requireFaceInRange(card: string, face: number, faceCount: number): void {
  if (face >= faceCount) {
    throw new CardFaceOutOfRangeError(card, face, faceCount);
  }
}

/**
 * Without faces given, a new card gets one face with the core's default image
 * and shows it, as the "create card" control of the card sheet makes a card.
 */
export function withNewCardDefaults(draft: CardDraft): CardDraft {
  const faces = draft.faces ?? [{}];
  const face = draft.face !== undefined ? draft.face : faces.length > 0 ? 0 : null;
  if (face !== null) {
    requireFaceInRange(`"${draft.name}"`, face, faces.length);
  }
  return { ...draft, faces, face };
}

/** Checks the face a card ends up showing when an update sets its face or replaces its faces. */
export function requireConsistentFace(card: Card, changes: CardChanges): void {
  if (changes.face === undefined && changes.faces === undefined) {
    return;
  }
  const face = changes.face !== undefined ? changes.face : card.face;
  if (face !== null) {
    requireFaceInRange(card.id, face, (changes.faces ?? card.faces).length);
  }
}

/** The face `Card#flip` gets; undefined leaves the choice to the core (face down, or else the first face). */
export function resolveFlipTarget(card: Card, target: CardFlipTarget | undefined): number | null | undefined {
  if (target === undefined || target === null) {
    return target;
  }
  if (target === 'next') {
    if (card.face === null) {
      requireFaceInRange(card.id, 0, card.faces.length);
      return 0;
    }
    if (card.face >= card.faces.length - 1) {
      throw new NoNextCardFaceError(card.id);
    }
    return card.face + 1;
  }
  if (target === 'previous') {
    if (card.face === null) {
      throw new NoPreviousCardFaceError(card.id);
    }
    return card.face === 0 ? null : Math.min(card.face, card.faces.length) - 1;
  }
  requireFaceInRange(card.id, target, card.faces.length);
  return target;
}

export function requireAvailable(stack: CardStackSummary, requested: number): void {
  if (stack.availableCount < requested) {
    throw new NotEnoughCardsError(stack, requested, stack.availableCount);
  }
}

export function requireOtherStack(source: CardStackSummary, destination: CardStackSummary): void {
  if (source.id === destination.id) {
    throw new SameCardStackError(source);
  }
}

/** The core refuses to pass a deck's card that is already out. */
export function requireNotOut(card: Card, source: CardStackSummary): void {
  if (isDeck(source) && card.drawn) {
    throw new CardAlreadyDrawnError(card.id, source);
  }
}

/**
 * What `Cards#pass` does with a card that enters a deck: one that came from
 * that deck goes back into it; a deck's own card is copied into the other deck.
 * Any other card would be stored there as drawn — out of play, held by no one —
 * so it is refused.
 */
export function requireCanEnter(card: Card, source: CardStackSummary, destination: CardStack): void {
  const returnsHome = card.originId === destination.id;
  if (isDeck(destination) && !returnsHome && !isDeck(source)) {
    throw new CardCannotEnterDeckError(card.id, destination);
  }
  if (!returnsHome && destination.cards.some((candidate) => candidate.id === card.id)) {
    throw new CardAlreadyInStackError(card.id, destination);
  }
}
