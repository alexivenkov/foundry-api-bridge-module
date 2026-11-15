import { z } from 'zod';
import {
  displayModeInputSchema,
  dispositionInputSchema,
  tokenAppearanceShape,
  tokenPlacementShape
} from './tokenAppearanceSchemas';

// Unknown keys are ignored rather than rejected, as the pre-DDD handlers did
// (the gateway, for one, sends `x` / `y` with `update-token`). Token commands
// have always tested `sceneId` for truthiness, so it may be empty or null.

const sceneId = z.string().nullish();

export const getSceneTokensRequestSchema = z.object({ sceneId });

const includeAppearance = z.boolean().optional();

export const getTokenRequestSchema = z.object({ sceneId, tokenId: z.string(), includeAppearance });

export const getTokenByActorRequestSchema = z.object({ sceneId, actorId: z.string(), includeAppearance });

export const getTokensInRangeRequestSchema = z.object({
  sceneId,
  originX: z.number(),
  originY: z.number(),
  range: z.number(),
  excludeTokenId: z.string().optional()
});

export const createTokenRequestSchema = z.object({
  sceneId,
  actorId: z.string(),
  x: z.number(),
  y: z.number(),
  hidden: z.boolean().optional(),
  elevation: z.number().optional(),
  rotation: z.number().optional(),
  scale: z.number().optional(),
  actorLink: z.boolean().optional(),
  ...tokenAppearanceShape,
  ...tokenPlacementShape,
  name: z.string().optional(),
  disposition: dispositionInputSchema.optional(),
  displayName: displayModeInputSchema.optional(),
  fromPrototype: z.boolean().optional(),
  includeAppearance
});

export const updateTokenRequestSchema = z.object({
  sceneId,
  tokenId: z.string(),
  hidden: z.boolean().optional(),
  elevation: z.number().optional(),
  rotation: z.number().optional(),
  scale: z.number().optional(),
  ...tokenAppearanceShape,
  ...tokenPlacementShape,
  name: z.string().optional(),
  displayName: displayModeInputSchema.optional(),
  disposition: dispositionInputSchema.optional(),
  lockRotation: z.boolean().optional(),
  actorLink: z.boolean().optional(),
  includeAppearance
});

export const deleteTokenRequestSchema = z.object({ sceneId, tokenId: z.string() });

export const moveTokenRequestSchema = z.object({
  sceneId,
  tokenId: z.string(),
  x: z.number(),
  y: z.number(),
  elevation: z.number().optional(),
  rotation: z.number().optional(),
  animate: z.boolean().optional(),
  canOpenDoors: z.boolean().optional()
});

export const setTokenTargetRequestSchema = z.object({
  tokenId: z.string(),
  targeted: z.boolean(),
  releaseOthers: z.boolean().optional()
});

export type GetSceneTokensRequest = z.infer<typeof getSceneTokensRequestSchema>;
export type GetTokenRequest = z.infer<typeof getTokenRequestSchema>;
export type GetTokenByActorRequest = z.infer<typeof getTokenByActorRequestSchema>;
export type GetTokensInRangeRequest = z.infer<typeof getTokensInRangeRequestSchema>;
export type CreateTokenRequest = z.infer<typeof createTokenRequestSchema>;
export type UpdateTokenRequest = z.infer<typeof updateTokenRequestSchema>;
export type DeleteTokenRequest = z.infer<typeof deleteTokenRequestSchema>;
export type MoveTokenRequest = z.infer<typeof moveTokenRequestSchema>;
export type SetTokenTargetRequest = z.infer<typeof setTokenTargetRequestSchema>;
