import { z } from 'zod';
import { EFFECT_DURATION_UNITS, EFFECT_ICON_VISIBILITIES } from '@/core/effects/domain';

// Strict validators for effect attributes that have no legacy clients. The
// core silently rounds a fractional sort or duration and reads `#f80` as
// `#000f80`, so such values are rejected or expanded here. Registry ids
// (subtypes, change types, phases, expiry events) are checked by the service
// against what the running world registers.

const SHORT_HEX = /^#[0-9a-f]{3}$/i;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function toLongHex(color: string): string {
  const lower = color.toLowerCase();
  return SHORT_HEX.test(lower) ? lower.replace(/[0-9a-f]/g, (digit) => digit + digit) : lower;
}

export const effectTintSchema = z.string().regex(HEX, 'must be a #rrggbb color').transform(toLongHex);
export const effectSortSchema = z.number().int();
export const effectTypeSchema = z.string().min(1);
export const effectSystemSchema = z.record(z.string(), z.unknown());
export const effectOriginSchema = z.string().min(1).nullable();
export const effectStatusesSchema = z.array(z.string().min(1));
export const effectShowIconSchema = z.enum(EFFECT_ICON_VISIBILITIES);

export const effectChangeSchema = z.object({
  key: z.string().min(1),
  type: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  priority: z.number().nullable().optional(),
  phase: z.string().min(1).optional()
});

export const effectDurationSchema = z.object({
  value: z.number().int().min(1),
  units: z.enum(EFFECT_DURATION_UNITS),
  expiry: z.string().min(1).nullable().optional()
});

/** Every attribute an effect-details command may set. */
export const effectAttributesShape = {
  img: z.string().min(1).nullable().optional(),
  disabled: z.boolean().optional(),
  transfer: z.boolean().optional(),
  description: z.string().optional(),
  tint: effectTintSchema.optional(),
  origin: effectOriginSchema.optional(),
  statuses: effectStatusesSchema.optional(),
  sort: effectSortSchema.optional(),
  changes: z.array(effectChangeSchema).optional(),
  duration: effectDurationSchema.nullable().optional(),
  showIcon: effectShowIconSchema.optional(),
  system: effectSystemSchema.optional()
};
