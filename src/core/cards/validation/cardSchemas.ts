import { z } from 'zod';
import { CARD_DRAW_MODES, CARD_STACK_TYPES } from '@/core/cards/domain';

// New commands without legacy clients: a wrong type, an out-of-enum value or an
// out-of-range number is rejected. Unknown keys are ignored. `folderId` given
// as null or '' on creation reads as absent (the directory root).

const id = z.string().min(1);
const name = z.string().trim().min(1);
const path = z.string().min(1);
const opaqueObject = z.record(z.string(), z.unknown());

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

const idList = z.array(id).min(1).refine(unique, { message: 'must not repeat an id' });

const cardFaceSchema = z.object({
  name: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  img: path.nullable().optional()
});

const moveOptionsShape = {
  faceDown: z.boolean().optional(),
  chatNotification: z.boolean().optional()
};

const countSchema = z.number().int().min(1).optional();
const drawModeSchema = z.enum(CARD_DRAW_MODES).optional();

export const getCardStacksRequestSchema = z.object({
  type: z.enum(CARD_STACK_TYPES).optional()
});

export const getCardStackRequestSchema = z.object({
  stackId: id
});

export const createCardStackRequestSchema = z
  .object({
    name,
    type: z.enum(CARD_STACK_TYPES).optional(),
    preset: z.string().min(1).optional(),
    description: z.string().optional(),
    img: path.optional(),
    folderId: z.string().nullish()
  })
  .refine((request) => request.type !== undefined || request.preset !== undefined, {
    message: 'type is required unless preset is given',
    path: ['type']
  });

export const updateCardStackRequestSchema = z.object({
  stackId: id,
  name: name.optional(),
  description: z.string().nullable().optional(),
  img: path.optional(),
  folderId: z.string().nullable().optional()
});

export const deleteCardStackRequestSchema = z.object({
  stackId: id,
  chatNotification: z.boolean().optional()
});

const cardAttributesShape = {
  value: z.number().nullable().optional(),
  faces: z.array(cardFaceSchema).optional(),
  face: z.number().int().min(0).nullable().optional(),
  back: cardFaceSchema.optional(),
  sort: z.number().int().optional(),
  system: opaqueObject.optional(),
  flags: opaqueObject.optional()
};

export const createCardRequestSchema = z.object({
  stackId: id,
  name,
  type: z.string().min(1).optional(),
  description: z.string().optional(),
  suit: z.string().optional(),
  ...cardAttributesShape
});

export const updateCardRequestSchema = z.object({
  stackId: id,
  cardId: id,
  name: name.optional(),
  description: z.string().nullable().optional(),
  suit: z.string().nullable().optional(),
  ...cardAttributesShape
});

export const deleteCardRequestSchema = z.object({
  stackId: id,
  cardId: id
});

export const shuffleCardsRequestSchema = z.object({
  stackId: id,
  ...moveOptionsShape
});

export const dealCardsRequestSchema = z.object({
  stackId: id,
  toStackIds: idList,
  count: countSchema,
  drawMode: drawModeSchema,
  ...moveOptionsShape
});

export const drawCardsRequestSchema = z.object({
  stackId: id,
  fromStackId: id,
  count: countSchema,
  drawMode: drawModeSchema,
  ...moveOptionsShape
});

export const passCardsRequestSchema = z.object({
  stackId: id,
  toStackId: id,
  cardIds: idList,
  ...moveOptionsShape
});

const playCardShape = {
  stackId: id,
  cardId: id,
  toStackId: id,
  ...moveOptionsShape
};

export const playCardRequestSchema = z.object(playCardShape);
export const discardCardRequestSchema = z.object(playCardShape);

export const recallCardsRequestSchema = z.object({
  stackId: id,
  ...moveOptionsShape
});

export const flipCardRequestSchema = z.object({
  stackId: id,
  cardId: id,
  face: z.union([z.number().int().min(0), z.literal('next'), z.literal('previous'), z.null()]).optional()
});

export const showCardRequestSchema = z.object({
  stackId: id,
  cardId: id,
  whisperTo: z.array(id).optional()
});

export type GetCardStacksRequest = z.infer<typeof getCardStacksRequestSchema>;
export type GetCardStackRequest = z.infer<typeof getCardStackRequestSchema>;
export type CreateCardStackRequest = z.infer<typeof createCardStackRequestSchema>;
export type UpdateCardStackRequest = z.infer<typeof updateCardStackRequestSchema>;
export type DeleteCardStackRequest = z.infer<typeof deleteCardStackRequestSchema>;
export type CreateCardRequest = z.infer<typeof createCardRequestSchema>;
export type UpdateCardRequest = z.infer<typeof updateCardRequestSchema>;
export type DeleteCardRequest = z.infer<typeof deleteCardRequestSchema>;
export type ShuffleCardsRequest = z.infer<typeof shuffleCardsRequestSchema>;
export type DealCardsRequest = z.infer<typeof dealCardsRequestSchema>;
export type DrawCardsRequest = z.infer<typeof drawCardsRequestSchema>;
export type PassCardsRequest = z.infer<typeof passCardsRequestSchema>;
export type PlayCardRequest = z.infer<typeof playCardRequestSchema>;
export type DiscardCardRequest = z.infer<typeof discardCardRequestSchema>;
export type RecallCardsRequest = z.infer<typeof recallCardsRequestSchema>;
export type FlipCardRequest = z.infer<typeof flipCardRequestSchema>;
export type ShowCardRequest = z.infer<typeof showCardRequestSchema>;
