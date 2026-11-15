import { emptyAsAbsent } from '@/core/shared';
import type {
  ActivateSceneCommand,
  CloneSceneCommand,
  CreateSceneCommand,
  DeleteSceneCommand,
  DescribeSceneQuery,
  UpdateSceneCommand,
  ViewSceneCommand
} from '@/core/scenes/application';
import type { SceneChanges, SceneGridChanges } from '@/core/scenes/domain';
import type {
  CloneSceneRequest,
  CreateSceneRequest,
  GetSceneRequest,
  SceneIdRequest,
  UpdateSceneRequest,
  ViewSceneRequest
} from './sceneSchemas';
import type { SceneSettingsRequest, UpdateSceneSettingsRequest } from './settingsSchemas';

type SceneAttributesRequest = Omit<UpdateSceneRequest, 'sceneId'>;

// On the wire `background` / `foreground` are image paths and `folder` is a
// folder id; scene results use `folder` for the folder's name.
function toSceneChanges(request: SceneAttributesRequest): SceneChanges {
  return {
    name: request.name,
    width: request.width,
    height: request.height,
    grid: request.grid,
    backgroundSrc: request.background,
    foregroundSrc: request.foreground,
    padding: request.padding,
    navigation: request.navigation,
    navName: request.navName,
    navOrder: request.navOrder,
    fogExploration: request.fogExploration,
    darkness: request.darkness,
    folderId: request.folder
  };
}

/** The original grid keys and the appearance keys come from two parses of the same `grid` object. */
function mergeGrid(
  original: SceneGridChanges | undefined,
  appearance: SceneSettingsRequest['grid']
): SceneGridChanges | undefined {
  if (appearance === undefined) {
    return original;
  }
  return { ...original, ...appearance };
}

function withSettings(changes: SceneChanges, settings: SceneSettingsRequest | undefined): SceneChanges {
  if (settings === undefined) {
    return changes;
  }
  return {
    ...changes,
    grid: mergeGrid(changes.grid, settings.grid),
    weather: settings.weather,
    tokenVision: settings.tokenVision,
    fogOverlaySrc: settings.fogOverlay,
    fogExploredColor: settings.fogExploredColor,
    fogUnexploredColor: settings.fogUnexploredColor,
    darknessLock: settings.darknessLock,
    blendAmbience: settings.blendAmbience,
    globalLight: settings.globalLight,
    baseAmbience: settings.baseAmbience,
    darkAmbience: settings.darkAmbience,
    initialView: settings.initialView,
    playlistId: settings.playlistId,
    playlistSoundId: settings.playlistSoundId,
    journalId: settings.journalId,
    journalPageId: settings.journalPageId,
    foregroundElevation: settings.foregroundElevation,
    backgroundColor: settings.backgroundColor
  };
}

export function toDescribeSceneQuery(request: GetSceneRequest): DescribeSceneQuery {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    includeScreenshot: Boolean(request.includeScreenshot)
  };
}

export function toCreateSceneCommand(request: CreateSceneRequest, settings?: SceneSettingsRequest): CreateSceneCommand {
  return { draft: { ...withSettings(toSceneChanges(request), settings), name: request.name } };
}

export function toUpdateSceneCommand(
  request: UpdateSceneRequest,
  settings?: UpdateSceneSettingsRequest
): UpdateSceneCommand {
  const changes = withSettings(toSceneChanges(request), settings);
  if (settings === undefined) {
    return { sceneId: request.sceneId, changes };
  }
  return {
    sceneId: request.sceneId,
    changes: { ...changes, initialLevelId: settings.initialLevelId },
    options: settings.animateDarkness === undefined ? undefined : { darknessAnimationMs: settings.animateDarkness }
  };
}

export function toDeleteSceneCommand(request: SceneIdRequest): DeleteSceneCommand {
  return { sceneId: request.sceneId };
}

export function toCloneSceneCommand(request: CloneSceneRequest): CloneSceneCommand {
  return {
    sourceId: request.sourceId,
    overrides: { name: request.name, folderId: request.folder }
  };
}

export function toActivateSceneCommand(request: SceneIdRequest): ActivateSceneCommand {
  return { sceneId: request.sceneId };
}

export function toViewSceneCommand(request: ViewSceneRequest): ViewSceneCommand {
  return { sceneId: request.sceneId, levelId: request.levelId };
}
