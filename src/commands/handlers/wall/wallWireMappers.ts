import type { WallDoorAnimation, WallSenseThreshold, WallSummary, WallThreshold as WireWallThreshold } from '@/commands/types';
import type { DoorAnimation, Wall, WallSenseThreshold as DomainSenseThreshold, WallThreshold } from '@/core/walls';

function toWireSenseThreshold(threshold: DomainSenseThreshold): WallSenseThreshold {
  return { proximity: threshold.proximity, distance: threshold.distance };
}

function toWireThreshold(threshold: WallThreshold): WireWallThreshold {
  return {
    light: toWireSenseThreshold(threshold.light),
    sight: toWireSenseThreshold(threshold.sight),
    sound: toWireSenseThreshold(threshold.sound),
    attenuation: threshold.attenuation
  };
}

function toWireAnimation(animation: DoorAnimation): WallDoorAnimation {
  return { ...animation };
}

export function toWireWall(wall: Wall): WallSummary {
  const summary: WallSummary = {
    id: wall.id,
    c: [...wall.segment],
    door: wall.door,
    doorState: wall.doorState,
    move: wall.movement,
    sense: wall.sight,
    sound: wall.sound,
    light: wall.light,
    dir: wall.direction
  };
  if (wall.threshold !== undefined) {
    summary.threshold = toWireThreshold(wall.threshold);
  }
  if (wall.doorSound !== undefined) {
    summary.doorSound = wall.doorSound;
  }
  if (wall.animation !== undefined) {
    summary.animation = wall.animation !== null ? toWireAnimation(wall.animation) : null;
  }
  return summary;
}
