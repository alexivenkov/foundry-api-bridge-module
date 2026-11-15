import type {
  CardFaceSummary,
  CardMoveSummary,
  CardOperationResult as WireCardOperationResult,
  CardResult as WireCardResult,
  CardStackDetails,
  CardStackSummary as WireCardStackSummary,
  CardSummary
} from '@/commands/types';
import type {
  Card,
  CardFace,
  CardMove,
  CardOperationResult,
  CardResult,
  CardStack,
  CardStackSummary
} from '@/core/cards';

function toWireCardFace(face: CardFace): CardFaceSummary {
  return { name: face.name, text: face.text, img: face.img };
}

export function toWireCard(card: Card): CardSummary {
  return {
    id: card.id,
    name: card.name,
    description: card.description,
    type: card.type,
    suit: card.suit,
    value: card.value,
    faces: card.faces.map(toWireCardFace),
    face: card.face,
    faceUp: card.faceUp,
    back: toWireCardFace(card.back),
    img: card.img,
    drawn: card.drawn,
    originId: card.originId,
    sort: card.sort,
    system: { ...card.system },
    flags: { ...card.flags }
  };
}

export function toWireCardStackSummary(stack: CardStackSummary): WireCardStackSummary {
  return {
    id: stack.id,
    uuid: stack.uuid,
    name: stack.name,
    type: stack.type,
    img: stack.img,
    folderId: stack.folderId,
    folderName: stack.folderName,
    ownerIds: [...stack.ownerIds],
    cardCount: stack.cardCount,
    availableCount: stack.availableCount,
    drawnCount: stack.drawnCount
  };
}

export function toWireCardStack(stack: CardStack): CardStackDetails {
  return {
    ...toWireCardStackSummary(stack),
    description: stack.description,
    cards: stack.cards.map(toWireCard)
  };
}

export function toWireCardMove(move: CardMove): CardMoveSummary {
  return { cardId: move.cardId, name: move.name, fromStackId: move.fromStackId, toStackId: move.toStackId };
}

export function toWireCardOperation(result: CardOperationResult): WireCardOperationResult {
  return { moved: result.moved.map(toWireCardMove), stacks: result.stacks.map(toWireCardStackSummary) };
}

export function toWireCardResult(result: CardResult): WireCardResult {
  return { stackId: result.stackId, card: toWireCard(result.card) };
}
