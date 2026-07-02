import type { CreateSceneParams, CreateSceneResult } from '@/commands/types';
import { isV14Plus } from '@/compat/foundryVersion';
import { getSceneClass, gridTypeStringToNumber, mapSceneToCrudSummary } from './sceneTypes';

export async function createSceneHandler(params: CreateSceneParams): Promise<CreateSceneResult> {
  const data: Record<string, unknown> = { name: params.name };

  if (params.width !== undefined) {
    data['width'] = params.width;
  }

  if (params.height !== undefined) {
    data['height'] = params.height;
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
      data['grid'] = gridData;
    }
  }

  if (params.background !== undefined) {
    data['background'] = { src: params.background };
  }

  if (params.foreground !== undefined) {
    data['foreground'] = params.foreground;
  }

  if (params.padding !== undefined) {
    data['padding'] = params.padding;
  }

  if (params.navigation !== undefined) {
    data['navigation'] = params.navigation;
  }

  if (params.navName !== undefined) {
    data['navName'] = params.navName;
  }

  if (params.navOrder !== undefined) {
    data['navOrder'] = params.navOrder;
  }

  if (params.fogExploration !== undefined) {
    if (isV14Plus()) {
      data['fog'] = { exploration: params.fogExploration };
    } else {
      data['fogExploration'] = params.fogExploration;
    }
  }

  if (params.darkness !== undefined) {
    if (isV14Plus()) {
      data['environment'] = { darknessLevel: params.darkness };
    } else {
      data['darkness'] = params.darkness;
    }
  }

  if (params.folder !== undefined) {
    data['folder'] = params.folder;
  }

  const scene = await getSceneClass().create(data);
  return mapSceneToCrudSummary(scene);
}
