import { z } from 'zod';
import {
  DARKNESS_MODES,
  MOVEMENT_COST_MAX,
  MOVEMENT_COST_STEP,
  REGION_EVENT_NAMES,
  SCROLLING_TEXT_EVENTS,
  SURFACE_PLACEMENTS,
  TELEPORT_DURATION_MAX_MS,
  TELEPORT_DURATION_MIN_MS,
  TELEPORT_PLACEMENTS,
  TEXT_VISIBILITIES,
  TOGGLE_BEHAVIOR_EVENTS,
  type CoreBehaviorSettingsMap,
  type CoreBehaviorType,
  type SettingsInput
} from '@/core/regions/domain';
import { HEX_COLOR } from './regionSchemas';

// The settings of each core behavior type, mirroring the type data models of Foundry
// 13.351 / 14.368: every field optional (create: core default, update: kept). Values
// the core would round or clamp silently (modifier 0–1, movement cost steps of 0.25
// up to 5, transition duration 500–10000 in steps of 100) are rejected instead.
// UUIDs must be absolute and name a document of the right type, world or compendium.

function uuidOf(documentName: string): z.ZodString {
  return z
    .string()
    .regex(new RegExp(`(^|\\.)${documentName}\\.[A-Za-z0-9]{16}$`), `must be an absolute ${documentName} UUID`);
}

const flag = z.boolean().optional();
const anyEvents = z.array(z.enum(REGION_EVENT_NAMES)).optional();
const dialogText = z.string().min(1, 'may not be empty; use null for the default text').nullable().optional();

type ConfigSchemas = { readonly [K in CoreBehaviorType]: z.ZodType<SettingsInput<CoreBehaviorSettingsMap[K]>> };

export const coreBehaviorConfigSchemas: ConfigSchemas = {
  adjustDarknessLevel: z.object({
    mode: z.enum(DARKNESS_MODES).optional(),
    modifier: z.number().min(0).max(1).optional()
  }),
  displayScrollingText: z.object({
    events: z.array(z.enum(SCROLLING_TEXT_EVENTS)).optional(),
    text: z.string().optional(),
    color: z.string().regex(HEX_COLOR, 'must be a #rrggbb color').optional(),
    visibility: z.enum(TEXT_VISIBILITIES).optional(),
    once: flag
  }),
  executeMacro: z.object({
    events: anyEvents,
    macroUuid: uuidOf('Macro').nullable().optional(),
    everyone: flag
  }),
  executeScript: z.object({
    events: anyEvents,
    source: z.string().optional()
  }),
  modifyMovementCost: z.object({
    difficulties: z
      .record(
        z.string().min(1),
        z.number().min(0).max(MOVEMENT_COST_MAX).multipleOf(MOVEMENT_COST_STEP).nullable()
      )
      .optional()
  }),
  pauseGame: z.object({ once: flag }),
  suppressWeather: z.object({}),
  teleportToken: z.object({
    destinationUuids: z.array(uuidOf('Region')).optional(),
    choice: flag,
    placement: z.enum(TELEPORT_PLACEMENTS).optional(),
    snap: flag,
    revealed: flag,
    dialog: z.object({ revealed: dialogText, unrevealed: dialogText }).optional(),
    transition: z
      .object({
        type: z.string().min(1).nullable().optional(),
        duration: z.number().int().min(TELEPORT_DURATION_MIN_MS).max(TELEPORT_DURATION_MAX_MS).multipleOf(100).optional()
      })
      .optional()
  }),
  toggleBehavior: z
    .object({
      events: z.array(z.enum(TOGGLE_BEHAVIOR_EVENTS)).optional(),
      enableUuids: z.array(uuidOf('RegionBehavior')).optional(),
      disableUuids: z.array(uuidOf('RegionBehavior')).optional()
    })
    .superRefine((settings, context) => {
      const enabled = new Set(settings.enableUuids ?? []);
      if ((settings.disableUuids ?? []).some((uuid) => enabled.has(uuid))) {
        context.addIssue({ code: 'custom', path: ['disableUuids'], message: 'may not repeat a UUID of enableUuids' });
      }
    }),
  applyActiveEffect: z.object({
    effectUuids: z.array(uuidOf('ActiveEffect')).optional()
  }),
  changeLevel: z.object({
    movementActions: z.array(z.string().min(1)).optional()
  }),
  defineSurface: z.object({
    placement: z.enum(SURFACE_PLACEMENTS).optional(),
    light: flag,
    move: flag,
    sight: flag,
    sound: flag,
    occlusion: flag,
    exposure: flag,
    culling: flag
  })
};
