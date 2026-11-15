export const CARD_STACK_TYPES = ['deck', 'hand', 'pile'] as const;
export type CardStackType = (typeof CARD_STACK_TYPES)[number];

/** Which cards a deal or a draw takes: the top of the stack (lowest sort), the bottom, or random ones. */
export const CARD_DRAW_MODES = ['top', 'bottom', 'random'] as const;
export type CardDrawMode = (typeof CARD_DRAW_MODES)[number];

/** `up` shows a card's first face, `down` its back. */
export type CardFacing = 'up' | 'down';

/** A face to flip a card to: an index, null for face down, or a step through its faces. */
export type CardFlipTarget = number | null | 'next' | 'previous';

export interface CardFace {
  readonly name: string | null;
  readonly text: string;
  readonly img: string | null;
}

export interface Card {
  readonly id: string;
  /** The card's own name, also while it lies face down. */
  readonly name: string;
  readonly description: string;
  readonly type: string;
  readonly suit: string;
  readonly value: number | null;
  readonly faces: readonly CardFace[];
  /** The face shown; null when the card lies face down. */
  readonly face: number | null;
  readonly faceUp: boolean;
  readonly back: CardFace;
  /** The image shown now. */
  readonly img: string;
  readonly drawn: boolean;
  readonly originId: string | null;
  readonly sort: number;
  readonly system: Readonly<Record<string, unknown>>;
  readonly flags: Readonly<Record<string, unknown>>;
}

/** A card stack: a deck, a hand or a pile (or a stack type a game system adds). */
export interface CardStackSummary {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly type: string;
  readonly img: string | null;
  readonly folderId: string | null;
  readonly folderName: string | null;
  readonly ownerIds: readonly string[];
  readonly cardCount: number;
  readonly availableCount: number;
  /** A deck's cards that are out; null for a hand or a pile. */
  readonly drawnCount: number | null;
}

export interface CardStack extends CardStackSummary {
  readonly description: string;
  /** Top first. */
  readonly cards: readonly Card[];
}

/** A face or the back of a card to write: an omitted field keeps its value or default, `null` clears it. */
export interface CardFaceChanges {
  readonly name?: string | null | undefined;
  readonly text?: string | null | undefined;
  readonly img?: string | null | undefined;
}

/**
 * The attributes a caller may set on a card. `faces` replaces the whole list,
 * `back` is merged field by field, `null` clears a text or the value.
 */
export interface CardChanges {
  readonly name?: string | undefined;
  readonly description?: string | null | undefined;
  readonly suit?: string | null | undefined;
  readonly value?: number | null | undefined;
  readonly faces?: readonly CardFaceChanges[] | undefined;
  readonly face?: number | null | undefined;
  readonly back?: CardFaceChanges | undefined;
  readonly sort?: number | undefined;
  readonly system?: Readonly<Record<string, unknown>> | undefined;
  readonly flags?: Readonly<Record<string, unknown>> | undefined;
}

export interface CardDraft extends CardChanges {
  readonly name: string;
  readonly type?: string | undefined;
}

/** `null` clears the description; a `null` folder is the root of the directory. */
export interface CardStackChanges {
  readonly name?: string | undefined;
  readonly description?: string | null | undefined;
  readonly img?: string | undefined;
  readonly folderId?: string | null | undefined;
}

/** `type` is a core stack type, or the type of the preset the stack is made from. */
export interface CardStackDraft extends CardStackChanges {
  readonly name: string;
  readonly type: string;
}

/** How the cards an operation moves are laid, and whether the core announces it in chat. */
export interface CardMoveOptions {
  readonly facing?: CardFacing | undefined;
  readonly chatNotification?: boolean | undefined;
}

export function isDeck(stack: Pick<CardStackSummary, 'type'>): boolean {
  return stack.type === 'deck';
}

export function describeStack(stack: Pick<CardStackSummary, 'id' | 'name'>): string {
  return `${stack.name} (${stack.id})`;
}
