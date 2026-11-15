import type { GetWeatherEffectsParams, GetWeatherEffectsResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundrySceneSettingsService, type SceneWiring } from '@/core/scenes';
import { toWireWeatherEffect } from './sceneWireMappers';

export function createGetWeatherEffectsHandler(
  wiring: SceneWiring = {}
): (params: GetWeatherEffectsParams) => Promise<GetWeatherEffectsResult> {
  const service = createFoundrySceneSettingsService(wiring);

  // The command takes no parameters, so there is nothing to validate.
  return function getWeatherEffectsHandler(_params: GetWeatherEffectsParams): Promise<GetWeatherEffectsResult> {
    try {
      return Promise.resolve({ weatherEffects: service.listWeatherEffects().map(toWireWeatherEffect) });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getWeatherEffectsHandler = createGetWeatherEffectsHandler();
