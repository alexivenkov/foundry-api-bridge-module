import { ValidationError } from '@/kernel';

export class UnknownDoorSoundError extends ValidationError {
  constructor(
    public readonly doorSound: string,
    known: readonly string[]
  ) {
    super(`Unknown door sound: ${doorSound}. Known: ${known.join(', ')}`);
    this.name = 'UnknownDoorSoundError';
    Object.setPrototypeOf(this, UnknownDoorSoundError.prototype);
  }
}

export class UnknownDoorAnimationError extends ValidationError {
  constructor(
    public readonly animationType: string,
    known: readonly string[]
  ) {
    super(`Unknown door animation: ${animationType}. Known: ${known.join(', ')}`);
    this.name = 'UnknownDoorAnimationError';
    Object.setPrototypeOf(this, UnknownDoorAnimationError.prototype);
  }
}

/** A proximity setting decides the sense's restriction, so it cannot come with the plain field of that sense. */
export class WallProximityConflictError extends ValidationError {
  constructor(sense: string, field: string) {
    super(`threshold.${sense}.proximity and ${field} cannot be set together`);
    this.name = 'WallProximityConflictError';
    Object.setPrototypeOf(this, WallProximityConflictError.prototype);
  }
}

export class WallThresholdDistanceRequiredError extends ValidationError {
  constructor(sense: string) {
    super(`A ${sense} proximity needs threshold.${sense}.distance`);
    this.name = 'WallThresholdDistanceRequiredError';
    Object.setPrototypeOf(this, WallThresholdDistanceRequiredError.prototype);
  }
}
