import { DomainError, ValidationError } from '@/kernel';
import type { LightKind } from '@/core/lights/domain/model/Light';

export class LightNotFoundError extends DomainError {
  constructor(public readonly lightId: string) {
    super(`Light not found: ${lightId}`);
    this.name = 'LightNotFoundError';
    Object.setPrototypeOf(this, LightNotFoundError.prototype);
  }
}

export class LightCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create light');
    this.name = 'LightCreationFailedError';
    Object.setPrototypeOf(this, LightCreationFailedError.prototype);
  }
}

export class UnknownLightAnimationError extends ValidationError {
  constructor(
    public readonly animationType: string,
    kind: LightKind,
    known: readonly string[]
  ) {
    super(`Unknown ${kind} animation: ${animationType}. Known: ${known.join(', ')}`);
    this.name = 'UnknownLightAnimationError';
    Object.setPrototypeOf(this, UnknownLightAnimationError.prototype);
  }
}

export class InvalidLightDarknessRangeError extends ValidationError {
  constructor(min: number, max: number) {
    super(`Darkness range min (${String(min)}) may not exceed max (${String(max)})`);
    this.name = 'InvalidLightDarknessRangeError';
    Object.setPrototypeOf(this, InvalidLightDarknessRangeError.prototype);
  }
}

export class UnknownLightLevelError extends ValidationError {
  constructor(public readonly levelId: string) {
    super(`Unknown scene level: ${levelId}`);
    this.name = 'UnknownLightLevelError';
    Object.setPrototypeOf(this, UnknownLightLevelError.prototype);
  }
}
