import { CoreFeatureUnavailableError } from '@/core/shared';
import {
  QUESTION_LIMITS,
  QuestionNotFoundError,
  QuestionUserNotFoundError,
  UserNotConnectedError,
  cancelQuestion,
  expireIfOverdue,
  isForgotten,
  planAdmission,
  settleQuestion,
  type Clock,
  type DialogOutcome,
  type QuestionLimits,
  type QuestionRegistry,
  type RequestIdGenerator,
  type UserDialogGateway,
  type UserQuestion
} from '@/core/dialogs/domain';
import type { AskUserCommand, QuestionCancellation, QuestionQuery } from './commands';

export interface UserQuestionServiceDependencies {
  readonly dialogs: UserDialogGateway;
  readonly registry: QuestionRegistry;
  readonly clock: Clock;
  readonly ids: RequestIdGenerator;
  readonly limits?: QuestionLimits | undefined;
}

/**
 * Asks a connected user a question in a dialog on their screen. A player may
 * take minutes and a server command times out long before, so `ask` returns
 * the pending question at once and the answer is read later by its id.
 */
export class UserQuestionService {
  private readonly limits: QuestionLimits;

  constructor(private readonly deps: UserQuestionServiceDependencies) {
    this.limits = deps.limits ?? QUESTION_LIMITS;
  }

  ask(command: AskUserCommand): UserQuestion {
    this.requireAvailable();
    const recipient = this.deps.dialogs.findRecipient(command.userId);
    if (recipient === null) {
      throw new QuestionUserNotFoundError(command.userId);
    }
    if (!recipient.active) {
      throw new UserNotConnectedError(recipient.id, recipient.name);
    }

    const now = this.deps.clock.now();
    this.housekeep(now);
    for (const requestId of planAdmission(this.deps.registry.list(), recipient.id, this.limits)) {
      this.deps.registry.remove(requestId);
    }

    const question: UserQuestion = {
      requestId: this.nextRequestId(),
      userId: recipient.id,
      userName: recipient.name,
      kind: command.spec.kind,
      title: command.spec.title,
      status: 'pending',
      askedAt: now,
      expiresAt: now + command.timeoutMs,
      settledAt: null,
      answer: null,
      error: null
    };
    this.deps.registry.save(question);

    this.deps.dialogs.ask(recipient.id, command.spec, command.timeoutMs).then(
      (outcome) => {
        this.settle(question.requestId, outcome);
      },
      (error: unknown) => {
        this.settle(question.requestId, { type: 'failed', reason: error instanceof Error ? error.message : String(error) });
      }
    );
    return question;
  }

  getAnswer(query: QuestionQuery): UserQuestion {
    this.requireAvailable();
    this.housekeep(this.deps.clock.now());
    return this.requireQuestion(query.requestId);
  }

  cancel(query: QuestionQuery): QuestionCancellation {
    this.requireAvailable();
    const now = this.deps.clock.now();
    this.housekeep(now);
    const question = this.requireQuestion(query.requestId);
    const cancelled = cancelQuestion(question, now);
    this.deps.registry.save(cancelled);
    return { question: cancelled, cancelled: cancelled !== question };
  }

  private requireAvailable(): void {
    if (!this.deps.dialogs.isAvailable()) {
      throw new CoreFeatureUnavailableError('Player dialogs require Foundry 13 or newer');
    }
  }

  private requireQuestion(requestId: string): UserQuestion {
    const question = this.deps.registry.find(requestId);
    if (question === null) {
      throw new QuestionNotFoundError(requestId);
    }
    return question;
  }

  private settle(requestId: string, outcome: DialogOutcome): void {
    const question = this.deps.registry.find(requestId);
    if (question !== null) {
      this.deps.registry.save(settleQuestion(question, outcome, this.deps.clock.now()));
    }
  }

  private housekeep(now: number): void {
    for (const question of this.deps.registry.list()) {
      const current = expireIfOverdue(question, now, this.limits);
      if (isForgotten(current, now, this.limits)) {
        this.deps.registry.remove(current.requestId);
      } else if (current !== question) {
        this.deps.registry.save(current);
      }
    }
  }

  private nextRequestId(): string {
    let requestId = this.deps.ids.next();
    while (this.deps.registry.find(requestId) !== null) {
      requestId = this.deps.ids.next();
    }
    return requestId;
  }
}
