import type { DeleteLightParams, DeleteLightResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryLightService, deleteLightRequestSchema, toDeleteLightCommand } from '@/core/lights';
import type { LightHandlerDependencies } from './GetLightsHandler';

export function createDeleteLightHandler(
  deps: LightHandlerDependencies = {}
): (params: DeleteLightParams) => Promise<DeleteLightResult> {
  const service = createFoundryLightService(deps);

  return async function deleteLightHandler(params: DeleteLightParams): Promise<DeleteLightResult> {
    const command = toDeleteLightCommand(parseRequest(deleteLightRequestSchema, params));
    const result = await service.deleteLight(command);
    return { deleted: true, lightId: result.lightId, sceneId: result.sceneId };
  };
}

export const deleteLightHandler = createDeleteLightHandler();
