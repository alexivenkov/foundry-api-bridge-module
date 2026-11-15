import type { AskUserCommand, QuestionQuery } from '@/core/dialogs/application';
import { DEFAULT_TIMEOUT_SECONDS, type QuestionSpec } from '@/core/dialogs/domain';
import type { AskUserRequest, QuestionRequest } from './dialogSchemas';

export function toAskUserCommand(request: AskUserRequest): AskUserCommand {
  return {
    userId: request.userId,
    spec: toQuestionSpec(request),
    timeoutMs: (request.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS) * 1000
  };
}

export function toQuestionQuery(request: QuestionRequest): QuestionQuery {
  return { requestId: request.requestId };
}

function toQuestionSpec(request: AskUserRequest): QuestionSpec {
  const text = { title: request.title, content: request.content };
  switch (request.kind) {
    case 'confirm':
      return { kind: 'confirm', ...text, yesLabel: request.yesLabel ?? null, noLabel: request.noLabel ?? null };
    case 'prompt':
      return {
        kind: 'prompt',
        ...text,
        inputType: request.inputType ?? 'text',
        inputLabel: request.inputLabel ?? null,
        defaultValue: request.defaultValue ?? null
      };
    case 'choice':
      return { kind: 'choice', ...text, choices: [...request.choices] };
  }
}
