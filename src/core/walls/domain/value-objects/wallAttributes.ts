import { ValidationError } from '@/kernel';

export const WALL_RESTRICTIONS = ['none', 'limited', 'normal'] as const;
export type WallRestriction = (typeof WALL_RESTRICTIONS)[number];

/** Movement is all-or-nothing: the core has no "limited" movement restriction. */
export const WALL_MOVEMENTS = ['none', 'normal'] as const;
export type WallMovement = (typeof WALL_MOVEMENTS)[number];

export const DOOR_TYPES = ['none', 'door', 'secret'] as const;
export type DoorType = (typeof DOOR_TYPES)[number];

export const DOOR_STATES = ['closed', 'open', 'locked'] as const;
export type DoorState = (typeof DOOR_STATES)[number];

export const WALL_DIRECTIONS = ['both', 'left', 'right'] as const;
export type WallDirection = (typeof WALL_DIRECTIONS)[number];

export type WallSegment = readonly [number, number, number, number];

export function parseWallMovement(restriction: WallRestriction): WallMovement {
  if (restriction === 'limited') {
    throw new ValidationError("Wall move must be 'none' or 'normal'");
  }
  return restriction;
}
