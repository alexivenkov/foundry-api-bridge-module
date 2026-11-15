import type { GetAmbientSoundsParams, GetAmbientSoundsResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryAmbientSoundService,
  getAmbientSoundsRequestSchema,
  toListAmbientSoundsQuery,
  type SoundWiring
} from '@/core/ambient-sounds';
import { toWireAmbientSound } from './ambientSoundWireMappers';

export type AmbientSoundHandlerDependencies = SoundWiring;

export function createGetAmbientSoundsHandler(
  deps: AmbientSoundHandlerDependencies = {}
): (params: GetAmbientSoundsParams) => Promise<GetAmbientSoundsResult> {
  const service = createFoundryAmbientSoundService(deps);

  return function getAmbientSoundsHandler(params: GetAmbientSoundsParams): Promise<GetAmbientSoundsResult> {
    try {
      const result = service.listAmbientSounds(
        toListAmbientSoundsQuery(parseRequest(getAmbientSoundsRequestSchema, params))
      );
      return Promise.resolve({
        sceneId: result.sceneId,
        ambientSounds: result.ambientSounds.map(toWireAmbientSound)
      });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getAmbientSoundsHandler = createGetAmbientSoundsHandler();
