import type {
  DoorAnimation,
  DoorAnimationChanges,
  DoorState,
  DoorType,
  WallDirection,
  WallMovement,
  WallRestriction,
  WallSegment,
  WallThreshold,
  WallThresholdChanges
} from '@/core/walls/domain/value-objects';

/**
 * A wall segment. `threshold`, `doorSound` and `animation` are `undefined`
 * where the core does not store them (threshold and door sound before 11,
 * animation before 13).
 */
export interface Wall {
  readonly id: string;
  readonly segment: WallSegment;
  readonly door: DoorType;
  readonly doorState: DoorState;
  readonly movement: WallMovement;
  readonly sight: WallRestriction;
  readonly sound: WallRestriction;
  readonly light: WallRestriction;
  readonly direction: WallDirection;
  readonly threshold?: WallThreshold | undefined;
  /** null = no sound. */
  readonly doorSound?: string | null | undefined;
  /** null = not configured. */
  readonly animation?: DoorAnimation | null | undefined;
}

/**
 * The attributes a caller may set; an omitted one is left to the core default
 * (create) or untouched (update). `doorSound: null` removes the sound,
 * `animation: null` the animation.
 */
export interface WallChanges {
  readonly segment?: WallSegment | undefined;
  readonly door?: DoorType | undefined;
  readonly doorState?: DoorState | undefined;
  readonly movement?: WallMovement | undefined;
  readonly sight?: WallRestriction | undefined;
  readonly sound?: WallRestriction | undefined;
  readonly light?: WallRestriction | undefined;
  readonly direction?: WallDirection | undefined;
  readonly threshold?: WallThresholdChanges | undefined;
  readonly doorSound?: string | null | undefined;
  readonly animation?: DoorAnimationChanges | null | undefined;
}

export interface WallDraft extends WallChanges {
  readonly segment: WallSegment;
}

export function isDoor(wall: Wall): boolean {
  return wall.door !== 'none';
}
