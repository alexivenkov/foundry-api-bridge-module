import type { QuestionSpec, UserQuestion } from '@/core/dialogs/domain';

export interface AskUserCommand {
  readonly userId: string;
  readonly spec: QuestionSpec;
  readonly timeoutMs: number;
}

export interface QuestionQuery {
  readonly requestId: string;
}

export interface QuestionCancellation {
  readonly question: UserQuestion;
  /** This call stopped a pending question. */
  readonly cancelled: boolean;
}
