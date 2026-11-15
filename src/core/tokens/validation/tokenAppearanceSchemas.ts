import { z } from 'zod';
import {
  TOKEN_DISPOSITIONS,
  TOKEN_LIGHT_COLORATIONS,
  TOKEN_NAME_DISPLAYS,
  TOKEN_RING_EFFECTS,
  TOKEN_SHAPES,
  TOKEN_TEXTURE_FITS,
  TOKEN_TURN_MARKER_MODES
} from '@/core/tokens/domain';

// The appearance fields have no legacy callers and are validated strictly.
// Ranges follow BaseToken / LightData (Foundry 13–14), but a value the core
// would clamp or round is rejected instead.

const SHORT_HEX = /^#[0-9a-f]{3}$/i;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** The core reads `#f80` as the number 0xf80 (`#000f80`), verified on 13.351 and 14.368, so it is expanded here. */
function toLongHex(color: string): string {
  const lower = color.toLowerCase();
  return SHORT_HEX.test(lower) ? lower.replace(/[0-9a-f]/g, (digit) => digit + digit) : lower;
}

const colorSchema = z.string().regex(HEX, 'must be a #rrggbb color').transform(toLongHex);
const unit = z.number().min(0).max(1);
const signedUnit = z.number().min(-1).max(1);
const degrees = z.number().min(0).max(360);
const path = z.string().min(1);
const nonZero = z.number().refine((value) => value !== 0, 'must not be 0');

const textureSchema = z.object({
  src: path.optional(),
  tint: colorSchema.optional(),
  fit: z.enum(TOKEN_TEXTURE_FITS).optional(),
  anchorX: z.number().optional(),
  anchorY: z.number().optional(),
  scaleX: nonZero.optional(),
  scaleY: nonZero.optional(),
  alphaThreshold: unit.optional(),
  offsetX: z.number().int().optional(),
  offsetY: z.number().int().optional(),
  rotation: z.number().optional()
});

const lightSchema = z.object({
  dim: z.number().min(0).optional(),
  bright: z.number().min(0).optional(),
  angle: degrees.optional(),
  color: colorSchema.nullable().optional(),
  alpha: unit.optional(),
  coloration: z.enum(TOKEN_LIGHT_COLORATIONS).optional(),
  luminosity: unit.optional(),
  attenuation: unit.optional(),
  saturation: signedUnit.optional(),
  contrast: signedUnit.optional(),
  shadows: unit.optional(),
  animation: z
    .object({
      type: z.string().nullable().optional(),
      speed: z.number().int().min(0).max(10).optional(),
      intensity: z.number().int().min(1).max(10).optional(),
      reverse: z.boolean().optional()
    })
    .optional(),
  darkness: z.object({ min: unit.optional(), max: unit.optional() }).optional(),
  negative: z.boolean().optional(),
  priority: z.number().int().min(0).optional()
});

const sightSchema = z.object({
  enabled: z.boolean().optional(),
  range: z.number().min(0).nullable().optional(),
  angle: degrees.optional(),
  visionMode: z.string().min(1).optional(),
  color: colorSchema.nullable().optional(),
  attenuation: unit.optional(),
  brightness: signedUnit.optional(),
  saturation: signedUnit.optional(),
  contrast: signedUnit.optional(),
  applyModeDefaults: z.boolean().optional()
});

const detectionModeSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean().optional(),
  range: z.number().min(0).nullable().optional()
});

const ringSchema = z.object({
  enabled: z.boolean().optional(),
  ringColor: colorSchema.nullable().optional(),
  backgroundColor: colorSchema.nullable().optional(),
  effects: z.array(z.enum(TOKEN_RING_EFFECTS)).optional(),
  subjectScale: z.number().min(0.5).optional(),
  subjectTexture: path.nullable().optional()
});

const turnMarkerSchema = z.object({
  mode: z.enum(TOKEN_TURN_MARKER_MODES).optional(),
  animation: z.string().min(1).nullable().optional(),
  src: path.nullable().optional(),
  disposition: z.boolean().optional()
});

const MAX_DETECTION_MODES = 50;

export const tokenAppearanceShape = {
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  depth: z.number().min(0).optional(),
  texture: textureSchema.optional(),
  alpha: unit.optional(),
  lockRotation: z.boolean().optional(),
  displayBars: z.enum(TOKEN_NAME_DISPLAYS).optional(),
  bar1: z.string().min(1).nullable().optional(),
  bar2: z.string().min(1).nullable().optional(),
  light: lightSchema.optional(),
  sight: sightSchema.optional(),
  detectionModes: z.array(detectionModeSchema).max(MAX_DETECTION_MODES).optional(),
  occludableRadius: z.number().min(0).optional(),
  ring: ringSchema.optional(),
  turnMarker: turnMarkerSchema.optional(),
  movementAction: z.string().min(1).nullable().optional()
};

export const tokenPlacementShape = {
  shape: z.enum(TOKEN_SHAPES).optional(),
  locked: z.boolean().optional(),
  sort: z.number().int().optional()
};

/** A disposition by name, or by the legacy number that `update-token` has always taken. */
export const dispositionInputSchema = z.union([z.enum(TOKEN_DISPOSITIONS), z.number()]);

/** A display mode by name, or by the legacy number that `update-token` has always taken. */
export const displayModeInputSchema = z.union([z.enum(TOKEN_NAME_DISPLAYS), z.number()]);

const actorId = z.string().min(1);

export const getPrototypeTokenRequestSchema = z.object({ actorId });

export const updatePrototypeTokenRequestSchema = z.object({
  actorId,
  ...tokenAppearanceShape,
  name: z.string().optional(),
  actorLink: z.boolean().optional(),
  randomImg: z.boolean().optional(),
  appendNumber: z.boolean().optional(),
  prependAdjective: z.boolean().optional(),
  rotation: z.number().optional(),
  disposition: dispositionInputSchema.optional(),
  displayName: displayModeInputSchema.optional()
});

export type TokenAppearanceInput = z.infer<z.ZodObject<typeof tokenAppearanceShape>>;
export type GetPrototypeTokenRequest = z.infer<typeof getPrototypeTokenRequestSchema>;
export type UpdatePrototypeTokenRequest = z.infer<typeof updatePrototypeTokenRequestSchema>;
