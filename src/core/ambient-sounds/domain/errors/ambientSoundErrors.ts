import { DomainError, ValidationError } from '@/kernel';

export class AmbientSoundNotFoundError extends DomainError {
  constructor(public readonly ambientSoundId: string) {
    super(`Ambient sound not found: ${ambientSoundId}`);
    this.name = 'AmbientSoundNotFoundError';
    Object.setPrototypeOf(this, AmbientSoundNotFoundError.prototype);
  }
}

export class AmbientSoundCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create ambient sound');
    this.name = 'AmbientSoundCreationFailedError';
    Object.setPrototypeOf(this, AmbientSoundCreationFailedError.prototype);
  }
}

export class UnknownSoundEffectError extends ValidationError {
  constructor(
    public readonly effectType: string,
    known: readonly string[]
  ) {
    super(`Unknown sound effect: ${effectType}. Known: ${known.join(', ')}`);
    this.name = 'UnknownSoundEffectError';
    Object.setPrototypeOf(this, UnknownSoundEffectError.prototype);
  }
}

export class InvalidSoundDarknessRangeError extends ValidationError {
  constructor(min: number, max: number) {
    super(`Darkness range min (${String(min)}) may not exceed max (${String(max)})`);
    this.name = 'InvalidSoundDarknessRangeError';
    Object.setPrototypeOf(this, InvalidSoundDarknessRangeError.prototype);
  }
}

export class UnknownSoundLevelError extends ValidationError {
  constructor(public readonly levelId: string) {
    super(`Unknown scene level: ${levelId}`);
    this.name = 'UnknownSoundLevelError';
    Object.setPrototypeOf(this, UnknownSoundLevelError.prototype);
  }
}

export class CanvasSceneRequiredError extends DomainError {
  constructor() {
    super("Positional sounds need a scene open on the GM's canvas");
    this.name = 'CanvasSceneRequiredError';
    Object.setPrototypeOf(this, CanvasSceneRequiredError.prototype);
  }
}

export class SceneNotOnCanvasError extends DomainError {
  constructor(public readonly sceneId: string) {
    super(`Scene ${sceneId} is not the scene open on the GM's canvas`);
    this.name = 'SceneNotOnCanvasError';
    Object.setPrototypeOf(this, SceneNotOnCanvasError.prototype);
  }
}
