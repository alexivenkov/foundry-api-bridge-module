import type { GetDoorSoundsParams, GetDoorSoundsResult } from '@/commands/types';
import { createFoundryWallService, type WallGameProvider, type WallGlobalsProvider } from '@/core/walls';

export interface GetDoorSoundsHandlerDependencies {
  gameProvider?: WallGameProvider;
  globals?: WallGlobalsProvider;
}

export function createGetDoorSoundsHandler(
  deps: GetDoorSoundsHandlerDependencies = {}
): (params: GetDoorSoundsParams) => Promise<GetDoorSoundsResult> {
  const service = createFoundryWallService(deps.gameProvider, { globals: deps.globals });

  // The command takes no parameters, so there is nothing to validate.
  return function getDoorSoundsHandler(_params: GetDoorSoundsParams): Promise<GetDoorSoundsResult> {
    const sounds = service.listDoorSounds().map((sound) => ({ id: sound.id, label: sound.label }));
    return Promise.resolve({ sounds });
  };
}

export const getDoorSoundsHandler = createGetDoorSoundsHandler();
