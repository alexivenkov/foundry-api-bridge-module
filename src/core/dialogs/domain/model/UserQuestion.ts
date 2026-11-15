export const QUESTION_KINDS = ['confirm', 'prompt', 'choice'] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

export const QUESTION_STATUSES = ['pending', 'answered', 'dismissed', 'timeout', 'cancelled', 'failed'] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const PROMPT_INPUT_TYPES = ['text', 'number'] as const;
export type PromptInputType = (typeof PROMPT_INPUT_TYPES)[number];

/** Title and content are plain text; they are escaped before they reach a dialog. */
interface QuestionText {
  readonly title: string;
  readonly content: string;
}

export interface ConfirmQuestionSpec extends QuestionText {
  readonly kind: 'confirm';
  /** Null keeps the core's label. */
  readonly yesLabel: string | null;
  readonly noLabel: string | null;
}

export interface PromptQuestionSpec extends QuestionText {
  readonly kind: 'prompt';
  readonly inputType: PromptInputType;
  readonly inputLabel: string | null;
  readonly defaultValue: string | number | null;
}

export interface ChoiceQuestionSpec extends QuestionText {
  readonly kind: 'choice';
  readonly choices: readonly string[];
}

export type QuestionSpec = ConfirmQuestionSpec | PromptQuestionSpec | ChoiceQuestionSpec;

export type QuestionAnswer =
  | { readonly kind: 'confirm'; readonly confirmed: boolean }
  | { readonly kind: 'prompt'; readonly value: string | number | null }
  | { readonly kind: 'choice'; readonly index: number; readonly label: string };

/** How a dialog ended, as the gateway reports it. */
export type DialogOutcome =
  | { readonly type: 'answered'; readonly answer: QuestionAnswer }
  | { readonly type: 'dismissed' }
  | { readonly type: 'timeout' }
  | { readonly type: 'failed'; readonly reason: string };

export interface QuestionRecipient {
  readonly id: string;
  readonly name: string;
  /** Connected right now. */
  readonly active: boolean;
}

/** A question asked of a user and what became of it. Times are epoch milliseconds. */
export interface UserQuestion {
  readonly requestId: string;
  readonly userId: string;
  readonly userName: string;
  readonly kind: QuestionKind;
  readonly title: string;
  readonly status: QuestionStatus;
  readonly askedAt: number;
  readonly expiresAt: number;
  readonly settledAt: number | null;
  readonly answer: QuestionAnswer | null;
  readonly error: string | null;
}
