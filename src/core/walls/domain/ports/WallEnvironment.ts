import type { DoorSoundOption } from '@/core/walls/domain/value-objects';

/** What the running Foundry generation stores on a wall. */
export interface WallFeatures {
  /** `animation` (Foundry 13+). */
  readonly doorAnimation: boolean;
}

export interface WallEnvironment {
  features(): WallFeatures;
  /** The door sounds the world registers; null when they cannot be read. */
  doorSounds(): readonly DoorSoundOption[] | null;
  /** The door animation types the world registers; null when they cannot be read. */
  doorAnimationTypes(): readonly string[] | null;
}
