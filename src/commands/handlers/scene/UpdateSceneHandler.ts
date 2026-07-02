import type { UpdateSceneParams, UpdateSceneResult } from '@/commands/types';
import { isV14Plus } from '@/compat/foundryVersion';
import { getGameCrud, gridTypeStringToNumber, mapSceneToCrudSummary } from './sceneTypes';

export async function updateSceneHandler(params: UpdateSceneParams): Promise<UpdateSceneResult> {
  const scene = getGameCrud().scenes.get(params.sceneId);
  if (!scene) {
    throw new Error(`Scene not found: ${params.sceneId}`);
  }

  const updateData: Record<string, unknown> = {};

  if (params.name !== undefined) {
    updateData['name'] = params.name;
  }

  if (params.width !== undefined) {
    updateData['width'] = params.width;
  }

  if (params.height !== undefined) {
    updateData['height'] = params.height;
  }

  if (params.grid !== undefined) {
    const gridData: Record<string, unknown> = {};
    if (params.grid.type !== undefined) {
      gridData['type'] = gridTypeStringToNumber(params.grid.type);
    }
    if (params.grid.size !== undefined) {
      gridData['size'] = params.grid.size;
    }
    if (params.grid.distance !== undefined) {
      gridData['distance'] = params.grid.distance;
    }
    if (params.grid.units !== undefined) {
      gridData['units'] = params.grid.units;
    }
    if (Object.keys(gridData).length > 0) {
      updateData['grid'] = gridData;
    }
  }

  if (params.background !== undefined) {
    updateData['background'] = { src: params.background };
  }

  if (params.foreground !== undefined) {
    updateData['foreground'] = params.foreground;
  }

  if (params.padding !== undefined) {
    updateData['padding'] = params.padding;
  }

  if (params.navigation !== undefined) {
    updateData['navigation'] = params.navigation;
  }

  if (params.navName !== undefined) {
    updateData['navName'] = params.navName;
  }

  if (params.navOrder !== undefined) {
    updateData['navOrder'] = params.navOrder;
  }

  if (params.fogExploration !== undefined) {
    if (isV14Plus()) {
      updateData['fog'] = { exploration: params.fogExploration };
    } else {
      updateData['fogExploration'] = params.fogExploration;
    }
  }

  if (params.darkness !== undefined) {
    if (isV14Plus()) {
      updateData['environment'] = { darknessLevel: params.darkness };
    } else {
      updateData['darkness'] = params.darkness;
    }
  }

  if (params.folder !== undefined) {
    updateData['folder'] = params.folder;
  }

  const updated = await scene.update(updateData);
  return mapSceneToCrudSummary(updated);
}
