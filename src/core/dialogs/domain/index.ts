export { PROMPT_INPUT_TYPES, QUESTION_KINDS, QUESTION_STATUSES } from './model/UserQuestion';
export type {
  ChoiceQuestionSpec,
  ConfirmQuestionSpec,
  DialogOutcome,
  PromptInputType,
  PromptQuestionSpec,
  QuestionAnswer,
  QuestionKind,
  QuestionRecipient,
  QuestionSpec,
  QuestionStatus,
  UserQuestion
} from './model/UserQuestion';
export {
  QuestionNotFoundError,
  QuestionRegistryFullError,
  QuestionUserNotFoundError,
  TooManyPendingQuestionsError,
  UserNotConnectedError
} from './errors/dialogErrors';
export { escapeHtml, plainTextToHtml } from './rules/plainTextHtml';
export {
  DEFAULT_TIMEOUT_SECONDS,
  MAX_TEXT_ANSWER_LENGTH,
  MAX_TIMEOUT_SECONDS,
  MIN_TIMEOUT_SECONDS,
  QUESTION_LIMITS,
  cancelQuestion,
  expireIfOverdue,
  isForgotten,
  planAdmission,
  settleQuestion
} from './rules/questionLifecycle';
export type { QuestionLimits } from './rules/questionLifecycle';
export type { Clock, QuestionRegistry, RequestIdGenerator, UserDialogGateway } from './ports/ports';
