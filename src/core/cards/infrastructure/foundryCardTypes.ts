import type { FoundryCardMoveOptions, FoundryCardsDocument } from './foundryCardsTypes';

/** A face or the back as stored (`BaseCard` schema, Foundry 13–14); a face without a name has no `name` key. */
export interface FoundryCardFaceSource {
  name?: string | null | undefined;
  text?: string | null | undefined;
  img?: string | null | undefined;
}

export interface FoundryCardSource {
  name: string;
  description?: string | null | undefined;
  type: string;
  suit?: string | null | undefined;
  value?: number | null | undefined;
  faces: FoundryCardFaceSource[];
  face: number | null;
  back: FoundryCardFaceSource;
  drawn: boolean;
  sort: number;
  system?: Record<string, unknown> | undefined;
  flags?: Record<string, unknown> | undefined;
}

/**
 * The client `Card` document. Its `name` and `back.img` are derived for display
 * (a face-down card is "Unknown Card"), so stored values are read from `_source`.
 */
export interface FoundryCardDocument {
  id: string;
  _source: FoundryCardSource;
  /** The image shown now: the current face, else the back, else the image of the card's deck. */
  img: string;
  /** The stack the card came from, resolved; null when it has none or that stack is gone. */
  origin: { id: string } | null | undefined;
  update(data: Record<string, unknown>): Promise<unknown>;
  /** A face index or null flips to it; without an argument the core flips face down, or else to the first face. */
  flip(face?: number | null): Promise<unknown>;
  play(to: FoundryCardsDocument, options: FoundryCardMoveOptions): Promise<unknown>;
  discard(to: FoundryCardsDocument, options: FoundryCardMoveOptions): Promise<unknown>;
  toMessage(messageData: Record<string, unknown>): Promise<{ id: string } | null | undefined>;
}

export interface FoundryCardCollection {
  contents: FoundryCardDocument[];
  get(id: string): FoundryCardDocument | undefined;
}
