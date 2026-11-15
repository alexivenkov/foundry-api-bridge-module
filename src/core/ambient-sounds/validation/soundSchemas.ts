import { z } from 'zod';
import { AUDIO_FILE_EXTENSIONS, isAudioPath } from '@/core/ambient-sounds/domain';

// Ranges follow BaseAmbientSound and `Sound#playAtPosition` (Foundry 13–14),
// but a value the core would clamp is rejected instead. Unknown keys are
// ignored; an absent, null or empty `sceneId` means the active scene.

const audioPath = z
  .string()
  .trim()
  .min(1)
  .refine(isAudioPath, `must be one audio file (.${AUDIO_FILE_EXTENSIONS.join(', .')})`);
const unit = z.number().min(0).max(1);
const positive = z.number().positive();
const optionalSceneId = z.string().nullish();
const ambientSoundId = z.string().min(1);
const effectIntensity = z.number().int().min(1).max(10);

const ambientEffectSchema = z.object({
  type: z.string().nullable().optional(),
  intensity: effectIntensity.optional()
});

const darknessSchema = z.object({
  min: unit.optional(),
  max: unit.optional()
});

const ambientSoundAttributesShape = {
  elevation: z.number().optional(),
  repeat: z.boolean().optional(),
  volume: unit.optional(),
  walls: z.boolean().optional(),
  easing: z.boolean().optional(),
  hidden: z.boolean().optional(),
  darkness: darknessSchema.optional(),
  baseEffect: ambientEffectSchema.optional(),
  muffledEffect: ambientEffectSchema.optional(),
  name: z.string().nullable().optional(),
  locked: z.boolean().optional(),
  levels: z.array(z.string().min(1)).optional()
};

export const getAmbientSoundsRequestSchema = z.object({
  sceneId: optionalSceneId
});

export const createAmbientSoundRequestSchema = z.object({
  sceneId: optionalSceneId,
  x: z.number(),
  y: z.number(),
  radius: positive,
  path: audioPath,
  ...ambientSoundAttributesShape
});

export const updateAmbientSoundRequestSchema = z.object({
  sceneId: optionalSceneId,
  ambientSoundId,
  x: z.number().optional(),
  y: z.number().optional(),
  radius: positive.optional(),
  path: audioPath.nullable().optional(),
  ...ambientSoundAttributesShape
});

export const deleteAmbientSoundRequestSchema = z.object({
  sceneId: optionalSceneId,
  ambientSoundId
});

const positionalEffectSchema = z.object({
  type: z.string().min(1),
  intensity: effectIntensity.optional()
});

export const playSoundAtPositionRequestSchema = z.object({
  src: audioPath,
  x: z.number(),
  y: z.number(),
  elevation: z.number().optional(),
  radius: positive,
  volume: unit.optional(),
  easing: z.boolean().optional(),
  walls: z.boolean().optional(),
  gmAlways: z.boolean().optional(),
  baseEffect: positionalEffectSchema.optional(),
  muffledEffect: positionalEffectSchema.optional(),
  sceneId: optionalSceneId
});

export const preloadSoundRequestSchema = z.object({
  src: audioPath
});

export type GetAmbientSoundsRequest = z.infer<typeof getAmbientSoundsRequestSchema>;
export type CreateAmbientSoundRequest = z.infer<typeof createAmbientSoundRequestSchema>;
export type UpdateAmbientSoundRequest = z.infer<typeof updateAmbientSoundRequestSchema>;
export type DeleteAmbientSoundRequest = z.infer<typeof deleteAmbientSoundRequestSchema>;
export type PlaySoundAtPositionRequest = z.infer<typeof playSoundAtPositionRequestSchema>;
export type PreloadSoundRequest = z.infer<typeof preloadSoundRequestSchema>;
