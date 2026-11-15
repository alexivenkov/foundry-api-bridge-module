import type {
  CreateLightCommand,
  DeleteLightCommand,
  ListLightsQuery,
  UpdateLightCommand
} from '@/core/lights/application';
import type { LightAnimationChanges, LightChanges } from '@/core/lights/domain';
import { emptyAsAbsent } from '@/core/shared';
import type {
  CreateLightRequest,
  DeleteLightRequest,
  GetLightsRequest,
  UpdateLightRequest
} from './lightSchemas';

type LightAttributesRequest = Omit<UpdateLightRequest, 'sceneId' | 'lightId'>;

/** An empty animation id or name means "none", as the core's own forms submit it. */
function emptyAsNull(value: string | null | undefined): string | null | undefined {
  return value === '' ? null : value;
}

function toAnimationChanges(
  animation: LightAttributesRequest['animation']
): LightAnimationChanges | undefined {
  if (animation === undefined) {
    return undefined;
  }
  return { ...animation, type: emptyAsNull(animation.type) };
}

function toLightChanges(request: LightAttributesRequest): LightChanges {
  return {
    x: request.x,
    y: request.y,
    elevation: request.elevation,
    rotation: request.rotation,
    walls: request.walls,
    vision: request.vision,
    hidden: request.hidden,
    dim: request.dim,
    bright: request.bright,
    angle: request.angle,
    color: request.color,
    alpha: request.alpha,
    coloration: request.coloration,
    luminosity: request.luminosity,
    attenuation: request.attenuation,
    saturation: request.saturation,
    contrast: request.contrast,
    shadows: request.shadows,
    animation: toAnimationChanges(request.animation),
    darkness: request.darkness,
    negative: request.negative,
    priority: request.priority,
    name: emptyAsNull(request.name),
    locked: request.locked,
    levels: request.levels
  };
}

export function toListLightsQuery(request: GetLightsRequest): ListLightsQuery {
  return { sceneId: emptyAsAbsent(request.sceneId) };
}

export function toCreateLightCommand(request: CreateLightRequest): CreateLightCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    draft: { ...toLightChanges(request), x: request.x, y: request.y }
  };
}

export function toUpdateLightCommand(request: UpdateLightRequest): UpdateLightCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    lightId: request.lightId,
    changes: toLightChanges(request)
  };
}

export function toDeleteLightCommand(request: DeleteLightRequest): DeleteLightCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), lightId: request.lightId };
}
