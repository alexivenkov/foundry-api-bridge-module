/** How a door opens on the canvas. */
export interface DoorAnimation {
  /** An animation type id of the running world. */
  readonly type: string;
  readonly reverse: boolean;
  readonly double: boolean;
  /** Milliseconds. */
  readonly duration: number;
  readonly flip: boolean;
  /** 0–2. */
  readonly strength: number;
  readonly texture: string | null;
}

export interface DoorAnimationChanges {
  readonly type?: string | undefined;
  readonly reverse?: boolean | undefined;
  readonly double?: boolean | undefined;
  readonly duration?: number | undefined;
  readonly flip?: boolean | undefined;
  readonly strength?: number | undefined;
  readonly texture?: string | null | undefined;
}

/** The schema initials of the core's wall animation (`BaseWall`, Foundry 13–14). */
export const DEFAULT_DOOR_ANIMATION: DoorAnimation = {
  type: 'swing',
  reverse: false,
  double: false,
  duration: 750,
  flip: false,
  strength: 1,
  texture: null
};

/** A door sound the world registers. */
export interface DoorSoundOption {
  readonly id: string;
  readonly label: string;
}
