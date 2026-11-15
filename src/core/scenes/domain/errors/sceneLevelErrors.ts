import { DomainError } from '@/kernel';

export class LevelNotFoundError extends DomainError {
  constructor(readonly levelId: string) {
    super(`Level not found: ${levelId}`);
    this.name = 'LevelNotFoundError';
    Object.setPrototypeOf(this, LevelNotFoundError.prototype);
  }
}

export class LevelElevationRangeError extends DomainError {
  constructor(
    readonly bottom: number,
    readonly top: number
  ) {
    super(`Level elevation top (${String(top)}) may not be below its bottom (${String(bottom)})`);
    this.name = 'LevelElevationRangeError';
    Object.setPrototypeOf(this, LevelElevationRangeError.prototype);
  }
}

export class LevelSeesItselfError extends DomainError {
  constructor(readonly levelId: string) {
    super(`A level cannot list itself among its visible levels: ${levelId}`);
    this.name = 'LevelSeesItselfError';
    Object.setPrototypeOf(this, LevelSeesItselfError.prototype);
  }
}

export class OnlyLevelDeletionError extends DomainError {
  constructor(readonly sceneId: string) {
    super(`Cannot delete the only level of scene ${sceneId}`);
    this.name = 'OnlyLevelDeletionError';
    Object.setPrototypeOf(this, OnlyLevelDeletionError.prototype);
  }
}

export class LevelCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create level');
    this.name = 'LevelCreationFailedError';
    Object.setPrototypeOf(this, LevelCreationFailedError.prototype);
  }
}
