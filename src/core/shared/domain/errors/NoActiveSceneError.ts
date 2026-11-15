import { DomainError } from '@/kernel';

export class NoActiveSceneError extends DomainError {
  constructor() {
    super('No active scene; specify sceneId');
    this.name = 'NoActiveSceneError';
    Object.setPrototypeOf(this, NoActiveSceneError.prototype);
  }
}
