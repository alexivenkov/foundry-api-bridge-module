import type { FoundryCardCollection, FoundryCardDocument } from './foundryCardTypes';

/** The options the core's card operations share: `updateData` is applied to every card moved. */
export interface FoundryCardMoveOptions {
  updateData?: Record<string, unknown> | undefined;
  chatNotification?: boolean | undefined;
}

export interface FoundryCardDrawOptions extends FoundryCardMoveOptions {
  /** A value of `CONST.CARD_DRAW_MODES`. */
  how: number;
}

/** The client `Cards` document (`BaseCards` schema and `Cards` API, Foundry 13–14). */
export interface FoundryCardsDocument {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string | null | undefined;
  description: string | null | undefined;
  folder: { id: string; name: string } | null | undefined;
  ownership: Readonly<Record<string, number>> | null | undefined;
  cards: FoundryCardCollection;
  /** A deck's cards that are not drawn; every card of any other stack. */
  availableCards: FoundryCardDocument[];
  drawnCards: FoundryCardDocument[];
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(operation?: Record<string, unknown>): Promise<unknown>;
  createEmbeddedDocuments(type: 'Card', data: Record<string, unknown>[]): Promise<FoundryCardDocument[]>;
  deleteEmbeddedDocuments(type: 'Card', ids: string[]): Promise<unknown>;
  shuffle(options: FoundryCardMoveOptions): Promise<unknown>;
  deal(to: FoundryCardsDocument[], number: number, options: FoundryCardDrawOptions): Promise<unknown>;
  draw(from: FoundryCardsDocument, number: number, options: FoundryCardDrawOptions): Promise<unknown>;
  pass(to: FoundryCardsDocument, ids: string[], options: FoundryCardMoveOptions): Promise<unknown>;
  recall(options: FoundryCardMoveOptions): Promise<unknown>;
}

export interface FoundryCardStacksCollection {
  contents: FoundryCardsDocument[];
  get(id: string): FoundryCardsDocument | undefined;
}

export interface FoundryCardsClass {
  /** Resolves to nothing when a `preCreateCards` hook or the data model refuses the stack. */
  create(data: Record<string, unknown>): Promise<FoundryCardsDocument | null | undefined>;
}

/** An entry of `CONFIG.Cards.presets`: the stack type it makes and the JSON file of its data. */
export interface FoundryCardPreset {
  type: string;
  src: string;
}

export interface FoundryPresetResponse {
  ok: boolean;
  json(): Promise<unknown>;
}

export interface FoundryCardGame {
  cards: FoundryCardStacksCollection;
  folders: { get(id: string): { type: string } | undefined };
  /** The document types of the world: `model.Card` has a key per card type. */
  model?: { Card?: Readonly<Record<string, unknown>> | undefined } | undefined;
}

export interface FoundryCardGlobals {
  game: FoundryCardGame;
  CONFIG: {
    Cards: {
      documentClass: FoundryCardsClass;
      presets?: Readonly<Record<string, FoundryCardPreset>> | undefined;
    };
  };
  foundry: {
    utils: {
      mergeObject(original: Record<string, unknown>, other: Record<string, unknown>): Record<string, unknown>;
    };
  };
  fetch(src: string): Promise<FoundryPresetResponse>;
}

export type CardGlobalsProvider = () => FoundryCardGlobals;

/** Reads the globals on every call, so a gateway can be built before Foundry is ready. */
export const cardGlobalsFromGlobalThis: CardGlobalsProvider = () => globalThis as unknown as FoundryCardGlobals;
