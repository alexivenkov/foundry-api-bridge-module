import type { PullUsersToSceneParams, PullUsersToSceneResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundrySceneTableService,
  pullUsersRequestSchema,
  toPullUsersCommand,
  type SceneWiring
} from '@/core/scenes';

export function createPullUsersToSceneHandler(
  wiring: SceneWiring = {}
): (params: PullUsersToSceneParams) => Promise<PullUsersToSceneResult> {
  const service = createFoundrySceneTableService(wiring);

  return function pullUsersToSceneHandler(params: PullUsersToSceneParams): Promise<PullUsersToSceneResult> {
    try {
      const pulled = service.pullUsers(toPullUsersCommand(parseRequest(pullUsersRequestSchema, params)));
      const result: PullUsersToSceneResult = {
        sceneId: pulled.sceneId,
        pulledUserIds: [...pulled.pulledUserIds],
        offlineUserIds: [...pulled.offlineUserIds]
      };
      if (pulled.levelId !== undefined) {
        result.levelId = pulled.levelId;
      }
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const pullUsersToSceneHandler = createPullUsersToSceneHandler();
