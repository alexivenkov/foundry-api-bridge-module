import { z } from 'zod';
import { emptyAsAbsent } from '@/core/shared';
import {
  LEVEL_FIT_MODES,
  type LevelChanges
} from '@/core/scenes/domain';
import type {
  CreateLevelCommand,
  DeleteLevelCommand,
  PreloadSceneCommand,
  PullUsersCommand,
  SceneTargetCommand,
  UpdateLevelCommand
} from '@/core/scenes/application';
import { hexColorSchema, idSchema } from './settingsSchemas';

// The commands added for the table and for levels. `sceneId` given as null
// or '' reads as the active scene; everything else is validated strictly.

const sceneIdShape = { sceneId: z.string().nullish() };
const unit = z.number().min(0).max(1);

export const sceneTargetRequestSchema = z.object(sceneIdShape);

export const pullUsersRequestSchema = z.object({
  ...sceneIdShape,
  userIds: z.array(idSchema).min(1).optional(),
  levelId: idSchema.optional()
});

export const preloadSceneRequestSchema = z.object({
  ...sceneIdShape,
  levelId: idSchema.optional()
});

const levelAttributesShape = {
  elevation: z
    .object({ bottom: z.number().nullable().optional(), top: z.number().nullable().optional() })
    .optional(),
  background: z
    .object({
      src: z.string().nullable().optional(),
      color: hexColorSchema.optional(),
      tint: hexColorSchema.optional(),
      alphaThreshold: unit.optional()
    })
    .optional(),
  foreground: z
    .object({
      src: z.string().nullable().optional(),
      tint: hexColorSchema.optional(),
      alphaThreshold: unit.optional()
    })
    .optional(),
  fogOverlay: z.string().nullable().optional(),
  positioning: z
    .object({
      anchorX: z.number().optional(),
      anchorY: z.number().optional(),
      offsetX: z.number().int().optional(),
      offsetY: z.number().int().optional(),
      fit: z.enum(LEVEL_FIT_MODES).optional(),
      scaleX: z.number().optional(),
      scaleY: z.number().optional(),
      rotation: z.number().min(0).lt(360).optional()
    })
    .optional(),
  visibleLevelIds: z.array(idSchema).optional(),
  sort: z.number().int().optional()
};

const levelName = z.string().trim().min(1);

export const createLevelRequestSchema = z.object({
  ...sceneIdShape,
  name: levelName,
  ...levelAttributesShape
});

export const updateLevelRequestSchema = z.object({
  ...sceneIdShape,
  levelId: idSchema,
  name: levelName.optional(),
  ...levelAttributesShape
});

export const deleteLevelRequestSchema = z.object({
  ...sceneIdShape,
  levelId: idSchema
});

export type SceneTargetRequest = z.infer<typeof sceneTargetRequestSchema>;
export type PullUsersRequest = z.infer<typeof pullUsersRequestSchema>;
export type PreloadSceneRequest = z.infer<typeof preloadSceneRequestSchema>;
export type CreateLevelRequest = z.infer<typeof createLevelRequestSchema>;
export type UpdateLevelRequest = z.infer<typeof updateLevelRequestSchema>;
export type DeleteLevelRequest = z.infer<typeof deleteLevelRequestSchema>;

export function toSceneTargetCommand(request: SceneTargetRequest): SceneTargetCommand {
  return { sceneId: emptyAsAbsent(request.sceneId) };
}

export function toPullUsersCommand(request: PullUsersRequest): PullUsersCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), userIds: request.userIds, levelId: request.levelId };
}

export function toPreloadSceneCommand(request: PreloadSceneRequest): PreloadSceneCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), levelId: request.levelId };
}

type LevelAttributesRequest = Omit<UpdateLevelRequest, 'sceneId' | 'levelId'>;

function toLevelChanges(request: LevelAttributesRequest): LevelChanges {
  return {
    name: request.name,
    elevation: request.elevation,
    background: request.background,
    foreground: request.foreground,
    fogOverlaySrc: request.fogOverlay,
    positioning: request.positioning,
    visibleLevelIds: request.visibleLevelIds,
    sort: request.sort
  };
}

export function toCreateLevelCommand(request: CreateLevelRequest): CreateLevelCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), draft: { ...toLevelChanges(request), name: request.name } };
}

export function toUpdateLevelCommand(request: UpdateLevelRequest): UpdateLevelCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), levelId: request.levelId, changes: toLevelChanges(request) };
}

export function toDeleteLevelCommand(request: DeleteLevelRequest): DeleteLevelCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), levelId: request.levelId };
}
