import { z } from 'zod';
import { LIGHT_COLORATIONS } from '@/core/lights/domain';

// Ranges follow LightData / BaseAmbientLight (Foundry 13–14), but a value the
// core would clamp is rejected instead. Unknown keys are ignored; an absent,
// null or empty `sceneId` means the active scene.

const SHORT_HEX = /^#[0-9a-f]{3}$/i;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** The core reads `#f80` as the number 0xf80 (`#000f80`), so a short color is expanded here. */
function toLongHex(color: string): string {
  const lower = color.toLowerCase();
  if (!SHORT_HEX.test(lower)) {
    return lower;
  }
  return lower.replace(/[0-9a-f]/g, (digit) => digit + digit);
}

const colorSchema = z.string().regex(HEX, 'must be a #rrggbb color').transform(toLongHex);
const unit = z.number().min(0).max(1);
const signedUnit = z.number().min(-1).max(1);
const optionalSceneId = z.string().nullish();
const lightId = z.string().min(1);

const animationSchema = z.object({
  type: z.string().nullable().optional(),
  speed: z.number().int().min(0).max(10).optional(),
  intensity: z.number().int().min(1).max(10).optional(),
  reverse: z.boolean().optional()
});

const darknessSchema = z.object({
  min: unit.optional(),
  max: unit.optional()
});

const lightAttributesShape = {
  elevation: z.number().optional(),
  rotation: z.number().optional(),
  walls: z.boolean().optional(),
  vision: z.boolean().optional(),
  hidden: z.boolean().optional(),
  dim: z.number().min(0).optional(),
  bright: z.number().min(0).optional(),
  angle: z.number().min(0).max(360).optional(),
  color: colorSchema.nullable().optional(),
  alpha: unit.optional(),
  coloration: z.enum(LIGHT_COLORATIONS).optional(),
  luminosity: unit.optional(),
  attenuation: unit.optional(),
  saturation: signedUnit.optional(),
  contrast: signedUnit.optional(),
  shadows: unit.optional(),
  animation: animationSchema.optional(),
  darkness: darknessSchema.optional(),
  negative: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
  name: z.string().nullable().optional(),
  locked: z.boolean().optional(),
  levels: z.array(z.string().min(1)).optional()
};

export const getLightsRequestSchema = z.object({
  sceneId: optionalSceneId
});

export const createLightRequestSchema = z.object({
  sceneId: optionalSceneId,
  x: z.number(),
  y: z.number(),
  ...lightAttributesShape
});

export const updateLightRequestSchema = z.object({
  sceneId: optionalSceneId,
  lightId,
  x: z.number().optional(),
  y: z.number().optional(),
  ...lightAttributesShape
});

export const deleteLightRequestSchema = z.object({
  sceneId: optionalSceneId,
  lightId
});

export type GetLightsRequest = z.infer<typeof getLightsRequestSchema>;
export type CreateLightRequest = z.infer<typeof createLightRequestSchema>;
export type UpdateLightRequest = z.infer<typeof updateLightRequestSchema>;
export type DeleteLightRequest = z.infer<typeof deleteLightRequestSchema>;
