import {
  CardNotFoundError,
  CardStackNotFoundError,
  type Card,
  type CardChanges,
  type CardDraft,
  type CardMoveOptions,
  type CardStore
} from '@/core/cards/domain';
import { toFoundryMoveOptions } from './cardCodes';
import { toCard, toFoundryCardData } from './cardMapper';
import type { FoundryCardDocument } from './foundryCardTypes';
import { cardGlobalsFromGlobalThis, type CardGlobalsProvider, type FoundryCardsDocument } from './foundryCardsTypes';

/** Anti-corruption layer over the Card documents embedded in a stack and the `Card` operations. */
export class FoundryCardStore implements CardStore {
  constructor(private readonly globals: CardGlobalsProvider = cardGlobalsFromGlobalThis) {}

  async createCard(stackId: string, draft: CardDraft): Promise<Card | null> {
    const created = await this.requireStack(stackId).createEmbeddedDocuments('Card', [toFoundryCardData(draft)]);
    const document = created[0];
    return document !== undefined ? toCard(document) : null;
  }

  async updateCard(stackId: string, cardId: string, changes: CardChanges): Promise<Card | null> {
    const document = this.requireStack(stackId).cards.get(cardId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryCardData(changes));
    return toCard(document);
  }

  async deleteCard(stackId: string, cardId: string): Promise<void> {
    await this.requireStack(stackId).deleteEmbeddedDocuments('Card', [cardId]);
  }

  async play(stackId: string, cardId: string, toStackId: string, options: CardMoveOptions): Promise<void> {
    const card = this.requireCard(stackId, cardId);
    await card.play(this.requireStack(toStackId), toFoundryMoveOptions(options));
  }

  async discard(stackId: string, cardId: string, toStackId: string, options: CardMoveOptions): Promise<void> {
    const card = this.requireCard(stackId, cardId);
    await card.discard(this.requireStack(toStackId), toFoundryMoveOptions(options));
  }

  async flip(stackId: string, cardId: string, face: number | null | undefined): Promise<Card | null> {
    const document = this.requireStack(stackId).cards.get(cardId);
    if (document === undefined) {
      return null;
    }
    await (face === undefined ? document.flip() : document.flip(face));
    return toCard(document);
  }

  async showInChat(stackId: string, cardId: string, whisperTo: readonly string[]): Promise<string | null> {
    const messageData: Record<string, unknown> = whisperTo.length > 0 ? { whisper: [...whisperTo] } : {};
    const message = await this.requireCard(stackId, cardId).toMessage(messageData);
    return message?.id ?? null;
  }

  private requireStack(stackId: string): FoundryCardsDocument {
    const document = this.globals().game.cards.get(stackId);
    if (document === undefined) {
      throw new CardStackNotFoundError(stackId);
    }
    return document;
  }

  private requireCard(stackId: string, cardId: string): FoundryCardDocument {
    const document = this.requireStack(stackId).cards.get(cardId);
    if (document === undefined) {
      throw new CardNotFoundError(stackId, cardId);
    }
    return document;
  }
}
