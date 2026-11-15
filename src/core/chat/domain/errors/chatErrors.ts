import { DomainError, ValidationError } from '@/kernel';

export class ChatMessageNotFoundError extends DomainError {
  constructor(public readonly messageId: string) {
    super(`Chat message not found: ${messageId}`);
    this.name = 'ChatMessageNotFoundError';
    Object.setPrototypeOf(this, ChatMessageNotFoundError.prototype);
  }
}

export class EmptyChatMessageError extends ValidationError {
  constructor() {
    super('Message content cannot be empty');
    this.name = 'EmptyChatMessageError';
    Object.setPrototypeOf(this, EmptyChatMessageError.prototype);
  }
}

export class NoChatMessageChangesError extends ValidationError {
  constructor() {
    super('No updates provided');
    this.name = 'NoChatMessageChangesError';
    Object.setPrototypeOf(this, NoChatMessageChangesError.prototype);
  }
}

export class WhisperRecipientNotFoundError extends DomainError {
  constructor(public readonly recipient: string) {
    super(`Whisper recipient not found: ${recipient}`);
    this.name = 'WhisperRecipientNotFoundError';
    Object.setPrototypeOf(this, WhisperRecipientNotFoundError.prototype);
  }
}

export class VisibilityConflictsWithWhisperError extends ValidationError {
  constructor(public readonly visibility: string) {
    super(`Visibility '${visibility}' cannot be combined with whisper recipients`);
    this.name = 'VisibilityConflictsWithWhisperError';
    Object.setPrototypeOf(this, VisibilityConflictsWithWhisperError.prototype);
  }
}

export class ChatMessageCreationCancelledError extends DomainError {
  constructor() {
    super('Chat message creation was cancelled by Foundry (a module hook may have vetoed it)');
    this.name = 'ChatMessageCreationCancelledError';
    Object.setPrototypeOf(this, ChatMessageCreationCancelledError.prototype);
  }
}
