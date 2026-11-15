import { DomainError } from '@/kernel';

export class QuestionNotFoundError extends DomainError {
  constructor(public readonly requestId: string) {
    super(`Question not found: ${requestId}`);
    this.name = 'QuestionNotFoundError';
    Object.setPrototypeOf(this, QuestionNotFoundError.prototype);
  }
}

export class QuestionUserNotFoundError extends DomainError {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'QuestionUserNotFoundError';
    Object.setPrototypeOf(this, QuestionUserNotFoundError.prototype);
  }
}

export class UserNotConnectedError extends DomainError {
  constructor(
    public readonly userId: string,
    userName: string
  ) {
    super(`User ${userName} (${userId}) is not connected; only a connected user can be asked`);
    this.name = 'UserNotConnectedError';
    Object.setPrototypeOf(this, UserNotConnectedError.prototype);
  }
}

export class TooManyPendingQuestionsError extends DomainError {
  constructor(userId: string, limit: number) {
    super(
      `User ${userId} already has ${String(limit)} pending questions; ` +
        'wait for an answer or cancel one with cancel-user-question'
    );
    this.name = 'TooManyPendingQuestionsError';
    Object.setPrototypeOf(this, TooManyPendingQuestionsError.prototype);
  }
}

export class QuestionRegistryFullError extends DomainError {
  constructor(limit: number) {
    super(
      `Too many open questions (limit ${String(limit)}); wait for answers or cancel some with cancel-user-question`
    );
    this.name = 'QuestionRegistryFullError';
    Object.setPrototypeOf(this, QuestionRegistryFullError.prototype);
  }
}
