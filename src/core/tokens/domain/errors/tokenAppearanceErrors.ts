import { DomainError, ValidationError } from '@/kernel';

/** An id the core would store without complaint although the world registers no such thing. */
export class UnknownTokenRegistryIdError extends ValidationError {
  constructor(
    public readonly registry: string,
    public readonly id: string,
    known: readonly string[]
  ) {
    super(`Unknown ${registry}: ${id}. Known: ${known.join(', ')}`);
    this.name = 'UnknownTokenRegistryIdError';
    Object.setPrototypeOf(this, UnknownTokenRegistryIdError.prototype);
  }
}

export class DuplicateDetectionModeError extends ValidationError {
  constructor(public readonly modeId: string) {
    super(`Detection mode listed more than once: ${modeId}`);
    this.name = 'DuplicateDetectionModeError';
    Object.setPrototypeOf(this, DuplicateDetectionModeError.prototype);
  }
}

export class InvalidTokenLightDarknessRangeError extends ValidationError {
  constructor(min: number, max: number) {
    super(`Light darkness range min (${String(min)}) may not exceed max (${String(max)})`);
    this.name = 'InvalidTokenLightDarknessRangeError';
    Object.setPrototypeOf(this, InvalidTokenLightDarknessRangeError.prototype);
  }
}

export class TokenScaleConflictError extends ValidationError {
  constructor() {
    super('scale cannot be combined with texture.scaleX or texture.scaleY');
    this.name = 'TokenScaleConflictError';
    Object.setPrototypeOf(this, TokenScaleConflictError.prototype);
  }
}

export class VisionModeDefaultsWithoutModeError extends ValidationError {
  constructor() {
    super('sight.applyModeDefaults needs sight.visionMode');
    this.name = 'VisionModeDefaultsWithoutModeError';
    Object.setPrototypeOf(this, VisionModeDefaultsWithoutModeError.prototype);
  }
}

export class PrototypeTokenUpdateFailedError extends DomainError {
  constructor(public readonly actorId: string) {
    super(`Failed to update the prototype token of actor ${actorId}`);
    this.name = 'PrototypeTokenUpdateFailedError';
    Object.setPrototypeOf(this, PrototypeTokenUpdateFailedError.prototype);
  }
}
