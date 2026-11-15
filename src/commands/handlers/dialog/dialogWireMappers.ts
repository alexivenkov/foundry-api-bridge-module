import type { UserQuestion as WireUserQuestion, UserQuestionAnswer } from '@/commands/types';
import type { QuestionAnswer, UserQuestion } from '@/core/dialogs';

export function toWireUserQuestion(question: UserQuestion): WireUserQuestion {
  return {
    requestId: question.requestId,
    userId: question.userId,
    userName: question.userName,
    kind: question.kind,
    title: question.title,
    status: question.status,
    askedAt: question.askedAt,
    expiresAt: question.expiresAt,
    settledAt: question.settledAt,
    answer: question.answer !== null ? toWireAnswer(question.answer) : null,
    error: question.error
  };
}

function toWireAnswer(answer: QuestionAnswer): UserQuestionAnswer {
  switch (answer.kind) {
    case 'confirm':
      return { kind: 'confirm', confirmed: answer.confirmed };
    case 'prompt':
      return { kind: 'prompt', value: answer.value };
    case 'choice':
      return { kind: 'choice', index: answer.index, label: answer.label };
  }
}
