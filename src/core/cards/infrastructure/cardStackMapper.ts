import {
  isDeck,
  orderFromTop,
  type CardStack,
  type CardStackChanges,
  type CardStackDraft,
  type CardStackSummary,
  type StackHoldings
} from '@/core/cards/domain';
import { ownerIdsOf } from './cardCodes';
import { toCard } from './cardMapper';
import type { FoundryCardsDocument } from './foundryCardsTypes';

export function toCardStackSummary(document: FoundryCardsDocument): CardStackSummary {
  return {
    id: document.id,
    uuid: document.uuid,
    name: document.name,
    type: document.type,
    img: document.img ?? null,
    folderId: document.folder?.id ?? null,
    folderName: document.folder?.name ?? null,
    ownerIds: ownerIdsOf(document.ownership),
    cardCount: document.cards.contents.length,
    availableCount: document.availableCards.length,
    drawnCount: isDeck(document) ? document.drawnCards.length : null
  };
}

export function toCardStack(document: FoundryCardsDocument): CardStack {
  return {
    ...toCardStackSummary(document),
    description: document.description ?? '',
    cards: orderFromTop(document.cards.contents.map(toCard))
  };
}

/** What the stack holds, by the core's own reading (`Cards#availableCards`). */
export function toStackHoldings(document: FoundryCardsDocument): StackHoldings {
  const held = document.availableCards.map((card) => ({
    id: card.id,
    name: card._source.name,
    sort: card._source.sort
  }));
  return { stackId: document.id, cards: orderFromTop(held).map(({ id, name }) => ({ id, name })) };
}

/** Only the attributes that are set become document fields; a cleared description is an empty one. */
export function toFoundryCardsData(changes: CardStackChanges | CardStackDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (changes.name !== undefined) {
    data['name'] = changes.name;
  }
  if ('type' in changes) {
    data['type'] = changes.type;
  }
  if (changes.description !== undefined) {
    data['description'] = changes.description ?? '';
  }
  if (changes.img !== undefined) {
    data['img'] = changes.img;
  }
  if (changes.folderId !== undefined) {
    data['folder'] = changes.folderId;
  }

  return data;
}
