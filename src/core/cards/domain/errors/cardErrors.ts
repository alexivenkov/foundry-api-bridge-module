import { DomainError } from '@/kernel';
import { describeStack, type CardStackSummary } from '@/core/cards/domain/model/Card';

type StackLabel = Pick<CardStackSummary, 'id' | 'name'>;

export class CardStackNotFoundError extends DomainError {
  constructor(public readonly stackId: string) {
    super(`Card stack not found: ${stackId}`);
    this.name = 'CardStackNotFoundError';
    Object.setPrototypeOf(this, CardStackNotFoundError.prototype);
  }
}

export class CardNotFoundError extends DomainError {
  constructor(
    public readonly stackId: string,
    public readonly cardId: string
  ) {
    super(`Card not found in card stack ${stackId}: ${cardId}`);
    this.name = 'CardNotFoundError';
    Object.setPrototypeOf(this, CardNotFoundError.prototype);
  }
}

export class CardStackCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create card stack');
    this.name = 'CardStackCreationFailedError';
    Object.setPrototypeOf(this, CardStackCreationFailedError.prototype);
  }
}

export class CardCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create card');
    this.name = 'CardCreationFailedError';
    Object.setPrototypeOf(this, CardCreationFailedError.prototype);
  }
}

export class CardStackFolderNotFoundError extends DomainError {
  constructor(public readonly folderId: string) {
    super(`Folder not found: ${folderId}`);
    this.name = 'CardStackFolderNotFoundError';
    Object.setPrototypeOf(this, CardStackFolderNotFoundError.prototype);
  }
}

export class NotACardStackFolderError extends DomainError {
  constructor(public readonly folderId: string) {
    super(`Folder ${folderId} is not a folder of card stacks`);
    this.name = 'NotACardStackFolderError';
    Object.setPrototypeOf(this, NotACardStackFolderError.prototype);
  }
}

function listOrNone(values: readonly string[]): string {
  return values.length > 0 ? values.join(', ') : 'none';
}

export class UnknownCardPresetError extends DomainError {
  constructor(
    public readonly preset: string,
    available: readonly string[]
  ) {
    super(`Unknown card preset: ${preset}; available presets: ${listOrNone(available)}`);
    this.name = 'UnknownCardPresetError';
    Object.setPrototypeOf(this, UnknownCardPresetError.prototype);
  }
}

export class CardPresetTypeMismatchError extends DomainError {
  constructor(preset: string, presetType: string, requestedType: string) {
    super(`Card preset ${preset} makes a ${presetType}, not a ${requestedType}`);
    this.name = 'CardPresetTypeMismatchError';
    Object.setPrototypeOf(this, CardPresetTypeMismatchError.prototype);
  }
}

export class CardPresetLoadFailedError extends DomainError {
  constructor(public readonly preset: string) {
    super(`Failed to load card preset ${preset}`);
    this.name = 'CardPresetLoadFailedError';
    Object.setPrototypeOf(this, CardPresetLoadFailedError.prototype);
  }
}

export class UnknownCardTypeError extends DomainError {
  constructor(type: string, available: readonly string[]) {
    super(`Unknown card type: ${type}; available types: ${listOrNone(available)}`);
    this.name = 'UnknownCardTypeError';
    Object.setPrototypeOf(this, UnknownCardTypeError.prototype);
  }
}

export class SameCardStackError extends DomainError {
  constructor(stack: StackLabel) {
    super(`Card stack ${describeStack(stack)} cannot move cards to itself`);
    this.name = 'SameCardStackError';
    Object.setPrototypeOf(this, SameCardStackError.prototype);
  }
}

export type CardDestinationAction = 'dealt' | 'played' | 'discarded';

export class DeckDestinationError extends DomainError {
  constructor(action: CardDestinationAction, deck: StackLabel) {
    super(`Cards can only be ${action} to a hand or a pile; ${describeStack(deck)} is a deck`);
    this.name = 'DeckDestinationError';
    Object.setPrototypeOf(this, DeckDestinationError.prototype);
  }
}

export class DeckCannotDrawError extends DomainError {
  constructor(deck: StackLabel) {
    super(`Only a hand or a pile can draw cards; ${describeStack(deck)} is a deck`);
    this.name = 'DeckCannotDrawError';
    Object.setPrototypeOf(this, DeckCannotDrawError.prototype);
  }
}

export class NotEnoughCardsError extends DomainError {
  constructor(stack: StackLabel, requested: number, available: number) {
    super(
      `Not enough cards in ${describeStack(stack)}: ${String(requested)} requested, ${String(available)} available`
    );
    this.name = 'NotEnoughCardsError';
    Object.setPrototypeOf(this, NotEnoughCardsError.prototype);
  }
}

export class CardAlreadyDrawnError extends DomainError {
  constructor(cardId: string, deck: StackLabel) {
    super(`Card ${cardId} is already out of deck ${describeStack(deck)}`);
    this.name = 'CardAlreadyDrawnError';
    Object.setPrototypeOf(this, CardAlreadyDrawnError.prototype);
  }
}

export class CardCannotEnterDeckError extends DomainError {
  constructor(cardId: string, deck: StackLabel) {
    super(`Card ${cardId} cannot go into deck ${describeStack(deck)}: a deck only takes back its own cards`);
    this.name = 'CardCannotEnterDeckError';
    Object.setPrototypeOf(this, CardCannotEnterDeckError.prototype);
  }
}

export class CardAlreadyInStackError extends DomainError {
  constructor(cardId: string, stack: StackLabel) {
    super(`Card stack ${describeStack(stack)} already contains card ${cardId}`);
    this.name = 'CardAlreadyInStackError';
    Object.setPrototypeOf(this, CardAlreadyInStackError.prototype);
  }
}

export class CardFaceOutOfRangeError extends DomainError {
  constructor(card: string, face: number, faceCount: number) {
    super(
      faceCount === 0
        ? `Card ${card} has no faces; it can only lie face down`
        : `Face ${String(face)} is out of range: card ${card} has ${String(faceCount)} face(s), ` +
          `0 to ${String(faceCount - 1)}`
    );
    this.name = 'CardFaceOutOfRangeError';
    Object.setPrototypeOf(this, CardFaceOutOfRangeError.prototype);
  }
}

export class NoNextCardFaceError extends DomainError {
  constructor(cardId: string) {
    super(`Card ${cardId} shows its last face; there is no next face`);
    this.name = 'NoNextCardFaceError';
    Object.setPrototypeOf(this, NoNextCardFaceError.prototype);
  }
}

export class NoPreviousCardFaceError extends DomainError {
  constructor(cardId: string) {
    super(`Card ${cardId} lies face down; there is no previous face`);
    this.name = 'NoPreviousCardFaceError';
    Object.setPrototypeOf(this, NoPreviousCardFaceError.prototype);
  }
}

export type CardOperationName = 'deal' | 'draw' | 'pass' | 'play' | 'discard';

export class CardOperationPreventedError extends DomainError {
  constructor(operation: CardOperationName) {
    super(`The ${operation} moved no card: a module or the game system prevented it`);
    this.name = 'CardOperationPreventedError';
    Object.setPrototypeOf(this, CardOperationPreventedError.prototype);
  }
}

export class CardMessageFailedError extends DomainError {
  constructor() {
    super('Failed to show card in chat');
    this.name = 'CardMessageFailedError';
    Object.setPrototypeOf(this, CardMessageFailedError.prototype);
  }
}
