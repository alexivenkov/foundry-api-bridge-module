import { z } from 'zod';

// The core movement commands have no legacy callers and are validated
// strictly. Token positions are whole pixels in the core, so a fractional
// x / y is rejected instead of being rounded. An absent, null or empty
// `sceneId` (and `tokenId` / `combatId` of the history clear) reads as absent.

const sceneId = z.string().nullish();
const tokenId = z.string().min(1);
const flag = z.boolean().optional();

export const MAX_MOVEMENT_WAYPOINTS = 100;

const waypointSchema = z.object({
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  elevation: z.number().optional(),
  action: z.string().min(1).optional(),
  snapped: flag,
  explicit: flag,
  checkpoint: flag
});

const waypoints = z.array(waypointSchema).min(1).max(MAX_MOVEMENT_WAYPOINTS);

export const tokenMovementRequestSchema = z.object({ sceneId, tokenId });

export const moveTokenPathRequestSchema = z.object({
  sceneId,
  tokenId,
  waypoints,
  ignoreWalls: flag,
  ignoreCost: flag,
  autoRotate: flag,
  showRuler: flag
});

export const pauseTokenMovementRequestSchema = z.object({ sceneId, tokenId, key: z.string().min(1).optional() });

export const resumeTokenMovementRequestSchema = z.object({
  sceneId,
  tokenId,
  movementId: z.string().min(1).optional(),
  key: z.string().min(1).optional()
});

export const measureTokenPathRequestSchema = z.object({ sceneId, tokenId, waypoints });

export const findTokenPathRequestSchema = z.object({ sceneId, tokenId, waypoints, ignoreWalls: flag, ignoreCost: flag });

export const revertTokenMovementRequestSchema = z.object({ sceneId, tokenId, movementId: z.string().min(1).optional() });

export const clearTokenMovementHistoryRequestSchema = z.object({
  sceneId,
  tokenId: z.string().nullish(),
  combatId: z.string().nullish()
});

export type TokenMovementRequest = z.infer<typeof tokenMovementRequestSchema>;
export type MoveTokenPathRequest = z.infer<typeof moveTokenPathRequestSchema>;
export type PauseTokenMovementRequest = z.infer<typeof pauseTokenMovementRequestSchema>;
export type ResumeTokenMovementRequest = z.infer<typeof resumeTokenMovementRequestSchema>;
export type MeasureTokenPathRequest = z.infer<typeof measureTokenPathRequestSchema>;
export type FindTokenPathRequest = z.infer<typeof findTokenPathRequestSchema>;
export type RevertTokenMovementRequest = z.infer<typeof revertTokenMovementRequestSchema>;
export type ClearTokenMovementHistoryRequest = z.infer<typeof clearTokenMovementHistoryRequestSchema>;
