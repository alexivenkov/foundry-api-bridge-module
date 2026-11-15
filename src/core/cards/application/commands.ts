import type {
  CardChanges,
  CardDraft,
  CardDrawMode,
  CardFlipTarget,
  CardMoveOptions,
  CardStackChanges,
  CardStackType
} from '@/core/cards/domain';

export interface ListCardStacksQuery {
  readonly type?: CardStackType | undefined;
}

export interface GetCardStackQuery {
  readonly stackId: string;
}

export interface CreateCardStackCommand {
  readonly name: string;
  /** Defaults to the preset's type; required without a preset. */
  readonly type?: CardStackType | undefined;
  readonly preset?: string | undefined;
  readonly changes: Omit<CardStackChanges, 'name'>;
}

export interface UpdateCardStackCommand {
  readonly stackId: string;
  readonly changes: CardStackChanges;
}

export interface DeleteCardStackCommand {
  readonly stackId: string;
  readonly chatNotification?: boolean | undefined;
}

export interface CreateCardCommand {
  readonly stackId: string;
  readonly draft: CardDraft;
}

export interface UpdateCardCommand {
  readonly stackId: string;
  readonly cardId: string;
  readonly changes: CardChanges;
}

export interface DeleteCardCommand {
  readonly stackId: string;
  readonly cardId: string;
}

export interface ShuffleCardsCommand {
  readonly stackId: string;
  readonly options: CardMoveOptions;
}

export interface DealCardsCommand {
  readonly stackId: string;
  readonly toStackIds: readonly string[];
  /** Cards per destination. */
  readonly count: number;
  readonly mode: CardDrawMode;
  readonly options: CardMoveOptions;
}

export interface DrawCardsCommand {
  readonly stackId: string;
  readonly fromStackId: string;
  readonly count: number;
  readonly mode: CardDrawMode;
  readonly options: CardMoveOptions;
}

export interface PassCardsCommand {
  readonly stackId: string;
  readonly toStackId: string;
  readonly cardIds: readonly string[];
  readonly options: CardMoveOptions;
}

/** Play or discard one card of a stack to a hand or a pile. */
export interface PlayCardCommand {
  readonly stackId: string;
  readonly cardId: string;
  readonly toStackId: string;
  readonly options: CardMoveOptions;
}

export interface RecallCardsCommand {
  readonly stackId: string;
  readonly options: CardMoveOptions;
}

export interface FlipCardCommand {
  readonly stackId: string;
  readonly cardId: string;
  readonly face?: CardFlipTarget | undefined;
}

export interface ShowCardCommand {
  readonly stackId: string;
  readonly cardId: string;
  readonly whisperTo: readonly string[];
}
