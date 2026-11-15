import { DomainError } from '@/kernel';

export class SceneCreationCancelledError extends DomainError {
  constructor() {
    super('Scene creation was cancelled by Foundry (a module hook may have vetoed it)');
    this.name = 'SceneCreationCancelledError';
    Object.setPrototypeOf(this, SceneCreationCancelledError.prototype);
  }
}

export class SceneCloneCancelledError extends DomainError {
  constructor() {
    super('Scene clone was cancelled by Foundry (a module hook may have vetoed it)');
    this.name = 'SceneCloneCancelledError';
    Object.setPrototypeOf(this, SceneCloneCancelledError.prototype);
  }
}

export class CanvasNotReadyError extends DomainError {
  constructor() {
    super('Canvas not ready');
    this.name = 'CanvasNotReadyError';
    Object.setPrototypeOf(this, CanvasNotReadyError.prototype);
  }
}
