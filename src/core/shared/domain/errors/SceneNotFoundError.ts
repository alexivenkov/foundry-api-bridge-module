import { DomainError } from '@/kernel';

export class SceneNotFoundError extends DomainError {
  constructor(public readonly sceneId: string) {
    super(`Scene not found: ${sceneId}`);
    this.name = 'SceneNotFoundError';
    Object.setPrototypeOf(this, SceneNotFoundError.prototype);
  }
}
