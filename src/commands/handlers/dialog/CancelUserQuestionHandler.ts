import type { CancelUserQuestionParams, CancelUserQuestionResult } from '@/commands/types';
import {
  createFoundryUserQuestionService,
  questionRequestSchema,
  toQuestionQuery,
  type DialogWiring
} from '@/core/dialogs';
import { parseRequest } from '@/core/shared';
import { toWireUserQuestion } from './dialogWireMappers';

export function createCancelUserQuestionHandler(
  wiring: DialogWiring = {}
): (params: CancelUserQuestionParams) => Promise<CancelUserQuestionResult> {
  const service = createFoundryUserQuestionService(wiring);

  return function cancelUserQuestionHandler(params: CancelUserQuestionParams): Promise<CancelUserQuestionResult> {
    try {
      const result = service.cancel(toQuestionQuery(parseRequest(questionRequestSchema, params)));
      return Promise.resolve({
        question: toWireUserQuestion(result.question),
        cancelled: result.cancelled,
        remoteDialogClosed: false
      });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const cancelUserQuestionHandler = createCancelUserQuestionHandler();
