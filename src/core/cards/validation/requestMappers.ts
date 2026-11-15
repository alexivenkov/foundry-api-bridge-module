import type {
  CreateCardCommand,
  CreateCardStackCommand,
  DealCardsCommand,
  DeleteCardCommand,
  DeleteCardStackCommand,
  DrawCardsCommand,
  FlipCardCommand,
  GetCardStackQuery,
  ListCardStacksQuery,
  PassCardsCommand,
  PlayCardCommand,
  RecallCardsCommand,
  ShowCardCommand,
  ShuffleCardsCommand,
  UpdateCardCommand,
  UpdateCardStackCommand
} from '@/core/cards/application';
import type { CardChanges, CardFaceChanges, CardMoveOptions } from '@/core/cards/domain';
import { emptyAsAbsent } from '@/core/shared';
import type {
  CreateCardRequest,
  CreateCardStackRequest,
  DealCardsRequest,
  DeleteCardRequest,
  DeleteCardStackRequest,
  DrawCardsRequest,
  FlipCardRequest,
  GetCardStackRequest,
  GetCardStacksRequest,
  PassCardsRequest,
  PlayCardRequest,
  RecallCardsRequest,
  ShowCardRequest,
  ShuffleCardsRequest,
  UpdateCardRequest,
  UpdateCardStackRequest
} from './cardSchemas';

const DEFAULT_COUNT = 1;
const DEFAULT_DRAW_MODE = 'top';

interface MoveOptionsRequest {
  faceDown?: boolean | undefined;
  chatNotification?: boolean | undefined;
}

type CardFaceRequest = NonNullable<CreateCardRequest['back']>;

function toMoveOptions(request: MoveOptionsRequest): CardMoveOptions {
  return {
    facing: request.faceDown === undefined ? undefined : request.faceDown ? 'down' : 'up',
    chatNotification: request.chatNotification
  };
}

function toFaceChanges(face: CardFaceRequest): CardFaceChanges {
  return { name: face.name, text: face.text, img: face.img };
}

function toCardChanges(request: Omit<UpdateCardRequest, 'stackId' | 'cardId'>): CardChanges {
  return {
    name: request.name,
    description: request.description,
    suit: request.suit,
    value: request.value,
    faces: request.faces?.map(toFaceChanges),
    face: request.face,
    back: request.back !== undefined ? toFaceChanges(request.back) : undefined,
    sort: request.sort,
    system: request.system,
    flags: request.flags
  };
}

export function toListCardStacksQuery(request: GetCardStacksRequest): ListCardStacksQuery {
  return { type: request.type };
}

export function toGetCardStackQuery(request: GetCardStackRequest): GetCardStackQuery {
  return { stackId: request.stackId };
}

export function toCreateCardStackCommand(request: CreateCardStackRequest): CreateCardStackCommand {
  return {
    name: request.name,
    type: request.type,
    preset: request.preset,
    changes: { description: request.description, img: request.img, folderId: emptyAsAbsent(request.folderId) }
  };
}

/** On update `null` or '' moves the stack to the root of the directory. */
export function toUpdateCardStackCommand(request: UpdateCardStackRequest): UpdateCardStackCommand {
  return {
    stackId: request.stackId,
    changes: {
      name: request.name,
      description: request.description,
      img: request.img,
      folderId: request.folderId === '' ? null : request.folderId
    }
  };
}

export function toDeleteCardStackCommand(request: DeleteCardStackRequest): DeleteCardStackCommand {
  return { stackId: request.stackId, chatNotification: request.chatNotification };
}

export function toCreateCardCommand(request: CreateCardRequest): CreateCardCommand {
  return {
    stackId: request.stackId,
    draft: { ...toCardChanges(request), name: request.name, type: request.type }
  };
}

export function toUpdateCardCommand(request: UpdateCardRequest): UpdateCardCommand {
  return { stackId: request.stackId, cardId: request.cardId, changes: toCardChanges(request) };
}

export function toDeleteCardCommand(request: DeleteCardRequest): DeleteCardCommand {
  return { stackId: request.stackId, cardId: request.cardId };
}

export function toShuffleCardsCommand(request: ShuffleCardsRequest): ShuffleCardsCommand {
  return { stackId: request.stackId, options: toMoveOptions(request) };
}

export function toDealCardsCommand(request: DealCardsRequest): DealCardsCommand {
  return {
    stackId: request.stackId,
    toStackIds: request.toStackIds,
    count: request.count ?? DEFAULT_COUNT,
    mode: request.drawMode ?? DEFAULT_DRAW_MODE,
    options: toMoveOptions(request)
  };
}

export function toDrawCardsCommand(request: DrawCardsRequest): DrawCardsCommand {
  return {
    stackId: request.stackId,
    fromStackId: request.fromStackId,
    count: request.count ?? DEFAULT_COUNT,
    mode: request.drawMode ?? DEFAULT_DRAW_MODE,
    options: toMoveOptions(request)
  };
}

export function toPassCardsCommand(request: PassCardsRequest): PassCardsCommand {
  return {
    stackId: request.stackId,
    toStackId: request.toStackId,
    cardIds: request.cardIds,
    options: toMoveOptions(request)
  };
}

/** Serves `discard-card` too: both requests have the same shape. */
export function toPlayCardCommand(request: PlayCardRequest): PlayCardCommand {
  return {
    stackId: request.stackId,
    cardId: request.cardId,
    toStackId: request.toStackId,
    options: toMoveOptions(request)
  };
}

export function toRecallCardsCommand(request: RecallCardsRequest): RecallCardsCommand {
  return { stackId: request.stackId, options: toMoveOptions(request) };
}

export function toFlipCardCommand(request: FlipCardRequest): FlipCardCommand {
  return { stackId: request.stackId, cardId: request.cardId, face: request.face };
}

export function toShowCardCommand(request: ShowCardRequest): ShowCardCommand {
  return { stackId: request.stackId, cardId: request.cardId, whisperTo: request.whisperTo ?? [] };
}
