import { DomainError } from '@/kernel';

export class SpeechBubblesUnavailableError extends DomainError {
  constructor(reason: 'unavailable' | 'local-only') {
    super(
      reason === 'local-only'
        ? 'This Foundry version can only show a speech bubble locally, not to other users'
        : 'Speech bubbles need the canvas to be ready'
    );
    this.name = 'SpeechBubblesUnavailableError';
    Object.setPrototypeOf(this, SpeechBubblesUnavailableError.prototype);
  }
}
