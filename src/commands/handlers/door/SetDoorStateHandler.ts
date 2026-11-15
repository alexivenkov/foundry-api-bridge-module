import type { SetDoorStateParams, SetDoorStateResult } from '@/commands/types';
import { NoActiveSceneError, parseRequest } from '@/core/shared';
import {
  createFoundryWallService,
  doorStateToWireCode,
  doorTypeToWireCode,
  setDoorStateRequestSchema,
  toSetDoorStateCommand,
  type WallGameProvider
} from '@/core/walls';

export interface SetDoorStateHandlerDependencies {
  gameProvider?: WallGameProvider;
}

export function createSetDoorStateHandler(
  deps: SetDoorStateHandlerDependencies = {}
): (params: SetDoorStateParams) => Promise<SetDoorStateResult> {
  const service = createFoundryWallService(deps.gameProvider);

  return async function setDoorStateHandler(params: SetDoorStateParams): Promise<SetDoorStateResult> {
    const command = toSetDoorStateCommand(parseRequest(setDoorStateRequestSchema, params));

    try {
      const result = await service.setDoorState(command);
      return {
        wallId: result.wall.id,
        door: doorTypeToWireCode(result.wall.door),
        previousState: doorStateToWireCode(result.previousState),
        newState: doorStateToWireCode(command.state)
      };
    } catch (error) {
      // Legacy wire text of this command is shorter than the domain wording.
      if (error instanceof NoActiveSceneError) {
        throw new Error('No active scene');
      }
      throw error;
    }
  };
}

export const setDoorStateHandler = createSetDoorStateHandler();
