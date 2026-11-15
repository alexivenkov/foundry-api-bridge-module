import type { GetUserAnswerParams, GetUserAnswerResult } from '@/commands/types';
import {
  createFoundryUserQuestionService,
  questionRequestSchema,
  toQuestionQuery,
  type DialogWiring
} from '@/core/dialogs';
import { parseRequest } from '@/core/shared';
import { toWireUserQuestion } from './dialogWireMappers';

export function createGetUserAnswerHandler(
  wiring: DialogWiring = {}
): (params: GetUserAnswerParams) => Promise<GetUserAnswerResult> {
  const service = createFoundryUserQuestionService(wiring);

  return function getUserAnswerHandler(params: GetUserAnswerParams): Promise<GetUserAnswerResult> {
    try {
      const question = service.getAnswer(toQuestionQuery(parseRequest(questionRequestSchema, params)));
      return Promise.resolve(toWireUserQuestion(question));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getUserAnswerHandler = createGetUserAnswerHandler();
