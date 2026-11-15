import { z } from 'zod';
import { effectAttributesShape, effectTypeSchema } from './effectAttributeSchemas';

// Unknown keys are ignored. An optional addressing id given as null or an
// empty string reads as absent: `itemId` alone names a world item, `actorId`
// or `tokenId` (+ `sceneId`) next to it an item that actor owns.

const id = z.string().min(1);
const optionalId = z.string().nullish();

const actorAddressShape = {
  actorId: optionalId,
  tokenId: optionalId,
  sceneId: optionalId
};

const itemAddressShape = {
  itemId: id,
  ...actorAddressShape
};

export const getActorEffectRequestSchema = z.object({
  ...actorAddressShape,
  effectId: id
});

export const getItemEffectsRequestSchema = z.object(itemAddressShape);

export const createItemEffectRequestSchema = z.object({
  ...itemAddressShape,
  ...effectAttributesShape,
  name: id,
  type: effectTypeSchema.optional()
});

export const updateItemEffectRequestSchema = z.object({
  ...itemAddressShape,
  ...effectAttributesShape,
  effectId: id,
  name: id.optional()
});

export const deleteItemEffectRequestSchema = z.object({
  ...itemAddressShape,
  effectId: id
});

export type GetActorEffectRequest = z.infer<typeof getActorEffectRequestSchema>;
export type GetItemEffectsRequest = z.infer<typeof getItemEffectsRequestSchema>;
export type CreateItemEffectRequest = z.infer<typeof createItemEffectRequestSchema>;
export type UpdateItemEffectRequest = z.infer<typeof updateItemEffectRequestSchema>;
export type DeleteItemEffectRequest = z.infer<typeof deleteItemEffectRequestSchema>;
