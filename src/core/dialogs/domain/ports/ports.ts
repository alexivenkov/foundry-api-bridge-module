import type {
  DialogOutcome,
  QuestionRecipient,
  QuestionSpec,
  UserQuestion
} from '@/core/dialogs/domain/model/UserQuestion';

/** Dialogs shown on another user's screen through the core's user queries. */
export interface UserDialogGateway {
  /** The running generation can query users (Foundry 13+). */
  isAvailable(): boolean;
  findRecipient(userId: string): QuestionRecipient | null;
  /**
   * Shows the dialog and resolves when the user answers or closes it, the core
   * times the query out after `timeoutMs`, or the core refuses it. Never rejects.
   */
  ask(userId: string, spec: QuestionSpec, timeoutMs: number): Promise<DialogOutcome>;
}

/** In-memory store of the questions asked; it lives as long as the GM page. */
export interface QuestionRegistry {
  list(): readonly UserQuestion[];
  find(requestId: string): UserQuestion | null;
  save(question: UserQuestion): void;
  remove(requestId: string): void;
}

export interface Clock {
  /** Epoch milliseconds. */
  now(): number;
}

export interface RequestIdGenerator {
  next(): string;
}
