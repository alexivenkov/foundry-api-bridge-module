import type { CloneSceneParams, CloneSceneResult } from '@/commands/types';
import { SceneNotFoundError, parseRequest } from '@/core/shared';
import {
  cloneSceneRequestSchema,
  createFoundrySceneService,
  toCloneSceneCommand,
  type SceneWiring
} from '@/core/scenes';
import { toWireScene } from './sceneWireMappers';

export function createCloneSceneHandler(
  wiring: SceneWiring = {}
): (params: CloneSceneParams) => Promise<CloneSceneResult> {
  const service = createFoundrySceneService(wiring);

  return async function cloneSceneHandler(params: CloneSceneParams): Promise<CloneSceneResult> {
    const command = toCloneSceneCommand(parseRequest(cloneSceneRequestSchema, params));

    try {
      return toWireScene(await service.cloneScene(command));
    } catch (error) {
      // Legacy wire text of this command: it names the missing scene as the source.
      if (error instanceof SceneNotFoundError) {
        throw new Error(`Source scene not found: ${error.sceneId}`);
      }
      throw error;
    }
  };
}

export const cloneSceneHandler = createCloneSceneHandler();
