import type {
  Card,
  CardChanges,
  CardDraft,
  CardDrawMode,
  CardMoveOptions,
  CardStack,
  CardStackChanges,
  CardStackDraft,
  CardStackSummary
} from '@/core/cards/domain/model/Card';
import type { StackHoldings } from '@/core/cards/domain/model/CardMove';

/** A ready-made stack the core can fill a new one from. */
export interface CardPreset {
  readonly key: string;
  readonly type: string;
}

export type CardFolderKind = 'card-stacks' | 'other';

// Reads are synchronous: the world's card stacks live in memory. Writes and
// operations on a stack that is gone fail with CardStackNotFoundError. An
// operation resolves once the core has applied it; what moved is read after.
export interface CardStackStore {
  listStacks(): readonly CardStackSummary[];
  findStack(stackId: string): CardStack | null;
  readHoldings(): readonly StackHoldings[];
  findFolderKind(folderId: string): CardFolderKind | null;
  listPresets(): readonly CardPreset[];
  listCardTypes(): readonly string[];
  /** False on cores whose deletion recall ignores the caller's options (before Foundry 14). */
  canSilenceDeletionRecall(): boolean;
  /** Resolves to null when the core created nothing. */
  createStack(draft: CardStackDraft, preset: string | undefined): Promise<CardStack | null>;
  updateStack(stackId: string, changes: CardStackChanges): Promise<CardStack | null>;
  deleteStack(stackId: string, chatNotification: boolean | undefined): Promise<void>;
  shuffle(stackId: string, options: CardMoveOptions): Promise<void>;
  deal(
    stackId: string,
    toStackIds: readonly string[],
    count: number,
    mode: CardDrawMode,
    options: CardMoveOptions
  ): Promise<void>;
  draw(
    stackId: string,
    fromStackId: string,
    count: number,
    mode: CardDrawMode,
    options: CardMoveOptions
  ): Promise<void>;
  pass(stackId: string, toStackId: string, cardIds: readonly string[], options: CardMoveOptions): Promise<void>;
  recall(stackId: string, options: CardMoveOptions): Promise<void>;
}

// The cards inside a stack. A card that is gone fails with CardNotFoundError.
export interface CardStore {
  /** Resolves to null when the core created nothing. */
  createCard(stackId: string, draft: CardDraft): Promise<Card | null>;
  updateCard(stackId: string, cardId: string, changes: CardChanges): Promise<Card | null>;
  deleteCard(stackId: string, cardId: string): Promise<void>;
  play(stackId: string, cardId: string, toStackId: string, options: CardMoveOptions): Promise<void>;
  discard(stackId: string, cardId: string, toStackId: string, options: CardMoveOptions): Promise<void>;
  /** Undefined lets the core choose the face. Resolves to the card as it is afterwards. */
  flip(stackId: string, cardId: string, face: number | null | undefined): Promise<Card | null>;
  /** Resolves to the id of the chat message, or null when the core created none. */
  showInChat(stackId: string, cardId: string, whisperTo: readonly string[]): Promise<string | null>;
}
