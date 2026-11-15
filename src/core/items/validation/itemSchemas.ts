import { z } from 'zod';
import { parseRequest } from '@/core/shared';

// Deliberately tolerant, as the pre-DDD handlers were: unknown keys are ignored
// and only the types the commands declare on the wire are checked. `system` is
// opaque game-system data. `null` clears the image or the folder; the core
// decides what it accepts. Fields added later (`sort`, token addressing) have
// no legacy clients and are validated strictly: the core would silently round
// a fractional sort.

const systemData = z.record(z.string(), z.unknown());
const clearableString = z.string().nullable().optional();
const sort = z.number().int().optional();

export const getItemRequestSchema = z.object({
  itemId: z.string()
});

export const createItemRequestSchema = z.object({
  name: z.string(),
  type: z.string(),
  folder: clearableString,
  img: clearableString,
  system: systemData.optional(),
  sort
});

export const updateItemRequestSchema = z.object({
  itemId: z.string(),
  name: z.string().optional(),
  img: clearableString,
  folder: clearableString,
  system: systemData.optional(),
  sort
});

export const deleteItemRequestSchema = z.object({
  itemId: z.string()
});

// `get-actor-items` has always tested `type` for truthiness, so it may be empty or null.
export const getActorItemsRequestSchema = z.object({
  actorId: z.string(),
  type: z.string().nullish(),
  equipped: z.boolean().optional(),
  hasActivities: z.boolean().optional()
});

export const addItemToActorRequestSchema = z.object({
  actorId: z.string(),
  name: z.string(),
  type: z.string(),
  img: clearableString,
  system: systemData.optional(),
  sort
});

export const updateActorItemRequestSchema = z.object({
  actorId: z.string(),
  itemId: z.string(),
  name: z.string().optional(),
  img: clearableString,
  system: systemData.optional(),
  sort
});

export const deleteActorItemRequestSchema = z.object({
  actorId: z.string(),
  itemId: z.string()
});

// The actor-item commands may address one token's own actor instead: a token id
// wins over an actor id, and an empty or null `sceneId` means the active scene.
const tokenOwnerShape = {
  tokenId: z.string().min(1),
  sceneId: z.string().nullish()
};

export const getTokenActorItemsRequestSchema = getActorItemsRequestSchema.omit({ actorId: true }).extend(tokenOwnerShape);
export const addItemToTokenActorRequestSchema = addItemToActorRequestSchema.omit({ actorId: true }).extend(tokenOwnerShape);
export const updateTokenActorItemRequestSchema = updateActorItemRequestSchema
  .omit({ actorId: true })
  .extend(tokenOwnerShape);
export const deleteTokenActorItemRequestSchema = deleteActorItemRequestSchema
  .omit({ actorId: true })
  .extend(tokenOwnerShape);

/** A request names a token when its `tokenId` holds anything but null or an empty string. */
function addressesToken(params: unknown): boolean {
  if (typeof params !== 'object' || params === null) {
    return false;
  }
  const tokenId = (params as { tokenId?: unknown }).tokenId;
  return tokenId !== undefined && tokenId !== null && tokenId !== '';
}

/**
 * Validates an actor-item request against the token form when it names a
 * token, and against the actor form — unchanged, `actorId` required — when it
 * does not.
 */
export function parseActorItemRequest<TActor, TToken>(
  actorSchema: z.ZodType<TActor>,
  tokenSchema: z.ZodType<TToken>,
  params: unknown
): TActor | TToken {
  return addressesToken(params) ? parseRequest(tokenSchema, params) : parseRequest(actorSchema, params);
}

export type GetItemRequest = z.infer<typeof getItemRequestSchema>;
export type CreateItemRequest = z.infer<typeof createItemRequestSchema>;
export type UpdateItemRequest = z.infer<typeof updateItemRequestSchema>;
export type DeleteItemRequest = z.infer<typeof deleteItemRequestSchema>;
export type GetActorItemsRequest =
  | z.infer<typeof getActorItemsRequestSchema>
  | z.infer<typeof getTokenActorItemsRequestSchema>;
export type AddItemToActorRequest =
  | z.infer<typeof addItemToActorRequestSchema>
  | z.infer<typeof addItemToTokenActorRequestSchema>;
export type UpdateActorItemRequest =
  | z.infer<typeof updateActorItemRequestSchema>
  | z.infer<typeof updateTokenActorItemRequestSchema>;
export type DeleteActorItemRequest =
  | z.infer<typeof deleteActorItemRequestSchema>
  | z.infer<typeof deleteTokenActorItemRequestSchema>;
