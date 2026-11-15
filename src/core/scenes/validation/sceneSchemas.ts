import { z } from 'zod';
import { SCENE_GRID_TYPES } from '@/core/scenes/domain';
import { idSchema } from './settingsSchemas';

// Deliberately tolerant, as the pre-DDD handlers were: unknown keys are ignored,
// and so is a grid type outside its enum. `null` clears an image, the
// navigation name or the folder; the core decides what else it accepts.
// The scene settings added since are parsed by their own, strict schemas
// (`settingsSchemas.ts`), so these keep ignoring what they never knew.

const clearableString = z.string().nullable().optional();

const gridSchema = z.object({
  type: z.enum(SCENE_GRID_TYPES).optional().catch(undefined),
  size: z.number().optional(),
  distance: z.number().optional(),
  units: z.string().optional()
});

const sceneAttributesShape = {
  width: z.number().optional(),
  height: z.number().optional(),
  grid: gridSchema.optional(),
  background: clearableString,
  foreground: clearableString,
  padding: z.number().optional(),
  navigation: z.boolean().optional(),
  navName: clearableString,
  navOrder: z.number().optional(),
  fogExploration: z.boolean().optional(),
  darkness: z.number().optional(),
  folder: clearableString
};

export const getSceneRequestSchema = z.object({
  // `get-scene` has always tested both for truthiness: an empty or null
  // `sceneId` means the active scene, and any truthy `includeScreenshot` asks
  // for a screenshot.
  sceneId: z.string().nullish(),
  includeScreenshot: z.unknown().optional()
});

/** `activate-scene`, `view-scene` and `delete-scene` take nothing but the scene. */
export const sceneIdRequestSchema = z.object({
  sceneId: z.string()
});

/** `view-scene` may also name a level (Foundry 14). */
export const viewSceneRequestSchema = sceneIdRequestSchema.extend({
  levelId: idSchema.optional()
});

export const createSceneRequestSchema = z.object({
  name: z.string(),
  ...sceneAttributesShape
});

export const updateSceneRequestSchema = z.object({
  sceneId: z.string(),
  name: z.string().optional(),
  ...sceneAttributesShape
});

export const cloneSceneRequestSchema = z.object({
  sourceId: z.string(),
  name: z.string().optional(),
  folder: clearableString
});

export type GetSceneRequest = z.infer<typeof getSceneRequestSchema>;
export type SceneIdRequest = z.infer<typeof sceneIdRequestSchema>;
export type ViewSceneRequest = z.infer<typeof viewSceneRequestSchema>;
export type CreateSceneRequest = z.infer<typeof createSceneRequestSchema>;
export type UpdateSceneRequest = z.infer<typeof updateSceneRequestSchema>;
export type CloneSceneRequest = z.infer<typeof cloneSceneRequestSchema>;
