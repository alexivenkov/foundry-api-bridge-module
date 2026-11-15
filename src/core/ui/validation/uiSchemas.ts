import { z } from 'zod';
import { GRID_SNAPPING_MODES, NOTIFICATION_LEVELS, SCROLLING_TEXT_ANCHORS } from '@/core/ui/domain';

// As tolerant as the pre-DDD handlers were: unknown keys are ignored, and a
// notification type the UI does not know is shown as plain info, not rejected.
// The key added later (`console`) and the newer commands are strict. `localize`
// stays unknown on purpose: a caller's text is never read as a localization key.

export const notifyRequestSchema = z.object({
  message: z.string(),
  type: z.enum(NOTIFICATION_LEVELS).optional().catch(undefined),
  permanent: z.boolean().optional(),
  console: z.boolean().optional()
});

export const panCanvasRequestSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  scale: z.number().optional(),
  duration: z.number().optional()
});

// `style` is any string: the canvas draws a style it does not know as a pulse,
// and modules may register styles of their own.
export const pingLocationRequestSchema = z.object({
  x: z.number(),
  y: z.number(),
  style: z.string().optional(),
  color: z.string().optional(),
  duration: z.number().optional()
});

const pct = z.number().min(0).max(1);
const notificationId = z.number().int().positive();

export const createProgressNotificationRequestSchema = z.object({
  message: z.string().min(1),
  type: z.enum(NOTIFICATION_LEVELS).optional(),
  pct: pct.optional(),
  permanent: z.boolean().optional(),
  console: z.boolean().optional()
});

export const updateProgressNotificationRequestSchema = z
  .object({
    notificationId,
    message: z.string().min(1).optional(),
    pct: pct.optional()
  })
  .refine((request) => request.message !== undefined || request.pct !== undefined, {
    message: 'needs message or pct',
    path: ['pct']
  });

export const removeNotificationRequestSchema = z.object({
  notificationId
});

const optionalSceneId = z.string().nullish();

export const MAX_PATH_WAYPOINTS = 100;

const waypointSchema = z.object({
  x: z.number(),
  y: z.number(),
  elevation: z.number().optional(),
  teleport: z.boolean().optional()
});

export const measureGridPathRequestSchema = z.object({
  sceneId: optionalSceneId,
  waypoints: z.array(waypointSchema).min(2).max(MAX_PATH_WAYPOINTS)
});

const snappingMode = z.enum(GRID_SNAPPING_MODES);

export const snapToGridRequestSchema = z.object({
  sceneId: optionalSceneId,
  x: z.number(),
  y: z.number(),
  mode: z.union([snappingMode, z.array(snappingMode).min(1)]),
  resolution: z.number().int().positive().optional()
});

const SHORT_HEX = /^#[0-9a-f]{3}$/i;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** The core reads `#f80` as the number 0xf80 (`#000f80`), so a short color is expanded here. */
function toLongHex(color: string): string {
  const lower = color.toLowerCase();
  return SHORT_HEX.test(lower) ? lower.replace(/[0-9a-f]/g, (digit) => digit + digit) : lower;
}

const anchor = z.enum(SCROLLING_TEXT_ANCHORS);

export const showScrollingTextRequestSchema = z.object({
  x: z.number(),
  y: z.number(),
  text: z.string().min(1).max(200),
  color: z.string().regex(HEX, 'must be a #rrggbb color').transform(toLongHex).optional(),
  fontSize: z.number().int().min(8).max(128).optional(),
  anchor: anchor.optional(),
  direction: anchor.optional(),
  duration: z.number().int().min(200).max(10_000).optional(),
  jitter: z.number().min(0).max(1).optional()
});

export type NotifyRequest = z.infer<typeof notifyRequestSchema>;
export type PanCanvasRequest = z.infer<typeof panCanvasRequestSchema>;
export type PingLocationRequest = z.infer<typeof pingLocationRequestSchema>;
export type CreateProgressNotificationRequest = z.infer<typeof createProgressNotificationRequestSchema>;
export type UpdateProgressNotificationRequest = z.infer<typeof updateProgressNotificationRequestSchema>;
export type RemoveNotificationRequest = z.infer<typeof removeNotificationRequestSchema>;
export type MeasureGridPathRequest = z.infer<typeof measureGridPathRequestSchema>;
export type SnapToGridRequest = z.infer<typeof snapToGridRequestSchema>;
export type ShowScrollingTextRequest = z.infer<typeof showScrollingTextRequestSchema>;
