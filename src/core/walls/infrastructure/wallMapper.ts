import {
  DEFAULT_DOOR_ANIMATION,
  THRESHOLD_SENSES,
  type DoorAnimation,
  type DoorAnimationChanges,
  type Wall,
  type WallChanges,
  type WallSenseThreshold,
  type WallThreshold,
  type WallThresholdChanges
} from '@/core/walls/domain';
import type { FoundryWallAnimation, FoundryWallDocument, FoundryWallThreshold } from './foundryWallTypes';
import {
  directionFromCode,
  directionToCode,
  doorStateFromCode,
  doorStateToCode,
  doorTypeFromCode,
  doorTypeToCode,
  movementFromCode,
  movementToCode,
  proximityFromCode,
  proximityToCode,
  restrictionFromCode,
  restrictionToCode
} from './wallCodes';

const REVERSE_DIRECTION = -1;

function toSenseThreshold(code: number | undefined, distance: number | null): WallSenseThreshold {
  return { proximity: proximityFromCode(code), distance };
}

function toThreshold(document: FoundryWallDocument, threshold: FoundryWallThreshold): WallThreshold {
  return {
    light: toSenseThreshold(document.light, threshold.light),
    sight: toSenseThreshold(document.sight, threshold.sight),
    sound: toSenseThreshold(document.sound, threshold.sound),
    attenuation: threshold.attenuation
  };
}

function toDoorAnimation(animation: FoundryWallAnimation): DoorAnimation {
  return {
    type: animation.type ?? DEFAULT_DOOR_ANIMATION.type,
    reverse: animation.direction === REVERSE_DIRECTION,
    double: animation.double ?? DEFAULT_DOOR_ANIMATION.double,
    duration: animation.duration ?? DEFAULT_DOOR_ANIMATION.duration,
    flip: animation.flip ?? DEFAULT_DOOR_ANIMATION.flip,
    strength: animation.strength ?? DEFAULT_DOOR_ANIMATION.strength,
    texture: animation.texture ?? null
  };
}

/**
 * `threshold` marks a core that stores the door sound as well (11+); the
 * sound is unset until one is chosen, and the core form stores "none" as `''`.
 */
function toWallDetails(document: FoundryWallDocument): Pick<Wall, 'threshold' | 'doorSound' | 'animation'> {
  const details: { threshold?: WallThreshold; doorSound?: string | null; animation?: DoorAnimation | null } = {};
  if (document.threshold !== undefined) {
    details.threshold = toThreshold(document, document.threshold);
    details.doorSound = document.doorSound !== undefined && document.doorSound !== '' ? document.doorSound : null;
  }
  if (document.animation !== undefined) {
    details.animation = document.animation !== null ? toDoorAnimation(document.animation) : null;
  }
  return details;
}

export function toWall(document: FoundryWallDocument): Wall {
  const c = document.c;
  return {
    id: document._id,
    segment: [c[0] ?? 0, c[1] ?? 0, c[2] ?? 0, c[3] ?? 0],
    door: doorTypeFromCode(document.door),
    doorState: doorStateFromCode(document.ds),
    movement: movementFromCode(document.move),
    sight: restrictionFromCode(document.sight),
    sound: restrictionFromCode(document.sound),
    light: restrictionFromCode(document.light),
    direction: directionFromCode(document.dir),
    ...toWallDetails(document)
  };
}

function toFoundryThreshold(changes: WallThresholdChanges): Record<string, unknown> {
  const threshold: Record<string, unknown> = {};
  for (const sense of THRESHOLD_SENSES) {
    const distance = changes[sense]?.distance;
    if (distance !== undefined) {
      threshold[sense] = distance;
    }
  }
  if (changes.attenuation !== undefined) {
    threshold['attenuation'] = changes.attenuation;
  }
  return threshold;
}

function toFoundryAnimationFields(changes: DoorAnimationChanges): Record<string, unknown> {
  const animation: Record<string, unknown> = {};
  if (changes.type !== undefined) {
    animation['type'] = changes.type;
  }
  if (changes.reverse !== undefined) {
    animation['direction'] = changes.reverse ? REVERSE_DIRECTION : 1;
  }
  for (const field of ['double', 'duration', 'flip', 'strength', 'texture'] as const) {
    if (changes[field] !== undefined) {
      animation[field] = changes[field];
    }
  }
  return animation;
}

/**
 * Foundry 13 merges a partial animation into a `null` one without filling in
 * the defaults (14 does), so a door that has none gets the full default object
 * with the changes on top.
 */
function toFoundryAnimation(
  changes: DoorAnimationChanges | null,
  current: FoundryWallDocument | undefined
): Record<string, unknown> | null {
  if (changes === null) {
    return null;
  }
  const fields = toFoundryAnimationFields(changes);
  if (current?.animation) {
    return fields;
  }
  return { ...toFoundryAnimationFields(DEFAULT_DOOR_ANIMATION), ...fields };
}

/**
 * Only the attributes that are set become document fields, so an update stays
 * a partial update. A proximity setting writes the sense's restriction code
 * (30 / 40) and wins over the plain restriction; removing the door sound
 * writes `''`, as the core form does.
 */
export function toFoundryWallData(changes: WallChanges, current?: FoundryWallDocument): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (changes.segment !== undefined) {
    data['c'] = [...changes.segment];
  }
  if (changes.door !== undefined) {
    data['door'] = doorTypeToCode(changes.door);
  }
  if (changes.doorState !== undefined) {
    data['ds'] = doorStateToCode(changes.doorState);
  }
  if (changes.movement !== undefined) {
    data['move'] = movementToCode(changes.movement);
  }
  if (changes.sight !== undefined) {
    data['sight'] = restrictionToCode(changes.sight);
  }
  if (changes.sound !== undefined) {
    data['sound'] = restrictionToCode(changes.sound);
  }
  if (changes.light !== undefined) {
    data['light'] = restrictionToCode(changes.light);
  }
  if (changes.direction !== undefined) {
    data['dir'] = directionToCode(changes.direction);
  }

  if (changes.threshold !== undefined) {
    for (const sense of THRESHOLD_SENSES) {
      const proximity = changes.threshold[sense]?.proximity;
      if (proximity !== undefined && proximity !== null) {
        data[sense] = proximityToCode(proximity);
      }
    }
    const threshold = toFoundryThreshold(changes.threshold);
    if (Object.keys(threshold).length > 0) {
      data['threshold'] = threshold;
    }
  }
  if (changes.doorSound !== undefined) {
    data['doorSound'] = changes.doorSound ?? '';
  }
  if (changes.animation !== undefined) {
    data['animation'] = toFoundryAnimation(changes.animation, current);
  }

  return data;
}
