import type {
  DoorState,
  DoorType,
  WallDirection,
  WallMovement,
  WallProximity,
  WallRestriction
} from '@/core/walls/domain';

// The numeric codes of the core constants, verified against Foundry 13.351 and
// 14.368: WALL_SENSE_TYPES / EDGE_SENSE_TYPES, WALL_MOVEMENT_TYPES,
// WALL_DOOR_TYPES, WALL_DOOR_STATES, WALL_DIRECTIONS / EDGE_DIRECTIONS.
// PROXIMITY (30) and DISTANCE (40) have no domain counterpart and read as normal.

const RESTRICTION_CODE: Readonly<Record<WallRestriction, number>> = { none: 0, limited: 10, normal: 20 };
const RESTRICTION_BY_CODE: Readonly<Record<number, WallRestriction>> = { 0: 'none', 10: 'limited', 20: 'normal' };

const DOOR_TYPE_CODE: Readonly<Record<DoorType, number>> = { none: 0, door: 1, secret: 2 };
const DOOR_TYPE_BY_CODE: Readonly<Record<number, DoorType>> = { 0: 'none', 1: 'door', 2: 'secret' };

const DOOR_STATE_CODE: Readonly<Record<DoorState, number>> = { closed: 0, open: 1, locked: 2 };
const DOOR_STATE_BY_CODE: Readonly<Record<number, DoorState>> = { 0: 'closed', 1: 'open', 2: 'locked' };

const DIRECTION_CODE: Readonly<Record<WallDirection, number>> = { both: 0, left: 1, right: 2 };
const DIRECTION_BY_CODE: Readonly<Record<number, WallDirection>> = { 0: 'both', 1: 'left', 2: 'right' };

export function restrictionToCode(value: WallRestriction): number {
  return RESTRICTION_CODE[value];
}

export function restrictionFromCode(code: number | undefined): WallRestriction {
  return RESTRICTION_BY_CODE[code ?? RESTRICTION_CODE.normal] ?? 'normal';
}

export function movementToCode(value: WallMovement): number {
  return RESTRICTION_CODE[value];
}

export function movementFromCode(code: number | undefined): WallMovement {
  return code === RESTRICTION_CODE.none ? 'none' : 'normal';
}

export function doorTypeToCode(value: DoorType): number {
  return DOOR_TYPE_CODE[value];
}

export function doorTypeFromCode(code: number | undefined): DoorType {
  return DOOR_TYPE_BY_CODE[code ?? DOOR_TYPE_CODE.none] ?? 'none';
}

export function doorStateToCode(value: DoorState): number {
  return DOOR_STATE_CODE[value];
}

export function doorStateFromCode(code: number | undefined): DoorState {
  return DOOR_STATE_BY_CODE[code ?? DOOR_STATE_CODE.closed] ?? 'closed';
}

export function directionToCode(value: WallDirection): number {
  return DIRECTION_CODE[value];
}

export function directionFromCode(code: number | undefined): WallDirection {
  return DIRECTION_BY_CODE[code ?? DIRECTION_CODE.both] ?? 'both';
}

// The proximity sense types (WALL_SENSE_TYPES / EDGE_SENSE_TYPES PROXIMITY and
// DISTANCE), read and written through `threshold` alone.
const PROXIMITY_CODE: Readonly<Record<WallProximity, number>> = { proximity: 30, 'reverse-proximity': 40 };

export function proximityFromCode(code: number | undefined): WallProximity | null {
  if (code === PROXIMITY_CODE.proximity) {
    return 'proximity';
  }
  return code === PROXIMITY_CODE['reverse-proximity'] ? 'reverse-proximity' : null;
}

export function proximityToCode(proximity: WallProximity): number {
  return PROXIMITY_CODE[proximity];
}
