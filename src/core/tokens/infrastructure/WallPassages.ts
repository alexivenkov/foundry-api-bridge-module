import type { PassageWall, Passages } from '@/core/tokens/domain';
import { isDoor, type Wall, type WallService } from '@/core/walls';

const DOOR_OPEN_DELAY_MS = 400;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function toPassageWall(wall: Wall): PassageWall {
  return {
    id: wall.id,
    segment: wall.segment,
    door: wall.door,
    doorState: wall.doorState,
    blocksMovement: wall.movement !== 'none'
  };
}

/**
 * The walls context seen through the eyes of a moving token. After opening a
 * door it waits for the door to swing open on screen before the token steps.
 */
export class WallPassages implements Passages {
  constructor(
    private readonly walls: WallService,
    private readonly pause: (milliseconds: number) => Promise<void> = wait
  ) {}

  listWalls(sceneId: string): readonly PassageWall[] {
    return this.walls.listWalls({ sceneId }).walls.map(toPassageWall);
  }

  async openDoor(sceneId: string, wallId: string): Promise<boolean> {
    const wall = this.walls.listWalls({ sceneId }).walls.find((candidate) => candidate.id === wallId);
    if (wall === undefined || !isDoor(wall) || wall.doorState !== 'closed') {
      return false;
    }
    await this.walls.setDoorState({ sceneId, wallId, state: 'open' });
    await this.pause(DOOR_OPEN_DELAY_MS);
    return true;
  }
}
