import type { SetDoorStateParams, SetDoorStateResult } from '@/commands/types';
import { getDoorScene, getWall, type DoorGame } from './doorTypes';

declare const game: DoorGame;

export async function setDoorStateHandler(params: SetDoorStateParams): Promise<SetDoorStateResult> {
  const scene = getDoorScene(game, params.sceneId);
  const wall = getWall(scene, params.wallId);

  if (wall.door === 0) {
    throw new Error(`Wall ${params.wallId} is not a door`);
  }

  if (params.state < 0 || params.state > 2) {
    throw new Error(`Invalid door state: ${String(params.state)}. Must be 0 (closed), 1 (open), or 2 (locked)`);
  }

  const previousState = wall.ds ?? 0;
  await wall.update({ ds: params.state });

  return {
    wallId: wall._id,
    door: wall.door,
    previousState,
    newState: params.state
  };
}
