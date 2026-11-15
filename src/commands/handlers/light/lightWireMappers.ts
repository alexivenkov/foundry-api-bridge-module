import type { LightResult, LightSummary } from '@/commands/types';
import type { Light, LightMutationResult } from '@/core/lights';

/** Fields the running Foundry generation does not have are left out, not sent as null. */
export function toWireLight(light: Light): LightSummary {
  return {
    id: light.id,
    x: light.x,
    y: light.y,
    ...(light.elevation !== undefined ? { elevation: light.elevation } : {}),
    rotation: light.rotation,
    walls: light.walls,
    vision: light.vision,
    hidden: light.hidden,
    dim: light.dim,
    bright: light.bright,
    angle: light.angle,
    color: light.color,
    alpha: light.alpha,
    coloration: light.coloration,
    luminosity: light.luminosity,
    attenuation: light.attenuation,
    saturation: light.saturation,
    contrast: light.contrast,
    shadows: light.shadows,
    animation: { ...light.animation },
    darkness: { ...light.darkness },
    ...(light.negative !== undefined ? { negative: light.negative } : {}),
    ...(light.priority !== undefined ? { priority: light.priority } : {}),
    ...(light.name !== undefined ? { name: light.name } : {}),
    ...(light.locked !== undefined ? { locked: light.locked } : {}),
    ...(light.levels !== undefined ? { levels: [...light.levels] } : {})
  };
}

export function toWireLightResult(result: LightMutationResult): LightResult {
  return { ...toWireLight(result.light), sceneId: result.sceneId };
}
