import { z } from 'zod';
import { SCENE_GRID_STYLES } from '@/core/scenes/domain';

// The scene settings added to `create-scene` / `update-scene`. The same
// params are parsed twice: by the original, tolerant schema for the original
// attributes, and by these for the settings. They have no legacy clients, so
// they are validated strictly: wrong types, unknown enum values and
// out-of-range numbers are rejected, with the ranges of the core's own fields.

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** `#rrggbb`. The core reads `#rgb` as a number (`#abc` → `#000abc`), so short forms are refused. */
export const hexColorSchema = z
  .string()
  .regex(HEX_COLOR, 'must be a #rrggbb color')
  .transform((color) => color.toLowerCase());

export const idSchema = z.string().min(1);

const unit = z.number().min(0).max(1);
const signedUnit = z.number().min(-1).max(1);

const darknessRangeSchema = z
  .object({ min: unit.optional(), max: unit.optional() })
  .refine((range) => range.min === undefined || range.max === undefined || range.min <= range.max, {
    message: 'min may not exceed max'
  });

const globalLightSchema = z.object({
  enabled: z.boolean().optional(),
  bright: z.boolean().optional(),
  color: hexColorSchema.nullable().optional(),
  alpha: unit.optional(),
  luminosity: unit.optional(),
  saturation: signedUnit.optional(),
  contrast: signedUnit.optional(),
  shadows: unit.optional(),
  darkness: darknessRangeSchema.optional()
});

const ambienceSchema = z.object({
  hue: z.number().min(0).lt(1).optional(),
  intensity: unit.optional(),
  luminosity: signedUnit.optional(),
  saturation: signedUnit.optional(),
  shadows: unit.optional()
});

const initialViewSchema = z.object({
  x: z.number().int().nullable().optional(),
  y: z.number().int().nullable().optional(),
  // Foundry 14 stores the scale in steps of 0.001; anything smaller becomes 0, which it rejects.
  scale: z.number().min(0.001).nullable().optional()
});

/** The keys added to the `grid` object; its original keys are left to the original schema. */
const gridAppearanceSchema = z.object({
  style: z.enum(SCENE_GRID_STYLES).optional(),
  color: hexColorSchema.optional(),
  alpha: unit.optional(),
  thickness: z.number().int().min(1).optional()
});

const sceneSettingsShape = {
  grid: gridAppearanceSchema.optional(),
  weather: idSchema.nullable().optional(),
  tokenVision: z.boolean().optional(),
  fogOverlay: z.string().nullable().optional(),
  fogExploredColor: hexColorSchema.nullable().optional(),
  fogUnexploredColor: hexColorSchema.nullable().optional(),
  darknessLock: z.boolean().optional(),
  blendAmbience: z.boolean().optional(),
  globalLight: globalLightSchema.optional(),
  baseAmbience: ambienceSchema.optional(),
  darkAmbience: ambienceSchema.optional(),
  initialView: initialViewSchema.nullable().optional(),
  playlistId: idSchema.nullable().optional(),
  playlistSoundId: idSchema.nullable().optional(),
  journalId: idSchema.nullable().optional(),
  journalPageId: idSchema.nullable().optional(),
  foregroundElevation: z.number().int().positive().optional(),
  backgroundColor: hexColorSchema.optional()
};

/** Clients fade over at most ten minutes. */
export const MAX_DARKNESS_ANIMATION_MS = 600_000;

export const createSceneSettingsRequestSchema = z.object(sceneSettingsShape);

export const updateSceneSettingsRequestSchema = z
  .object({
    ...sceneSettingsShape,
    animateDarkness: z.number().int().positive().max(MAX_DARKNESS_ANIMATION_MS).optional(),
    initialLevelId: idSchema.nullable().optional(),
    // Read only to tell whether the update changes the darkness; the original schema parses it.
    darkness: z.unknown().optional()
  })
  .refine((request) => request.animateDarkness === undefined || request.darkness !== undefined, {
    message: 'animateDarkness needs darkness',
    path: ['animateDarkness']
  });

export type SceneSettingsRequest = z.infer<typeof createSceneSettingsRequestSchema>;
export type UpdateSceneSettingsRequest = z.infer<typeof updateSceneSettingsRequestSchema>;
