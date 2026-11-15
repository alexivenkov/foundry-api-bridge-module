import type { AskUserParams, AskUserResult } from '@/commands/types';
import {
  askUserRequestSchema,
  createFoundryUserQuestionService,
  toAskUserCommand,
  type DialogWiring
} from '@/core/dialogs';
import { parseRequest } from '@/core/shared';
import { toWireUserQuestion } from './dialogWireMappers';

export function createAskUserHandler(wiring: DialogWiring = {}): (params: AskUserParams) => Promise<AskUserResult> {
  const service = createFoundryUserQuestionService(wiring);

  return function askUserHandler(params: AskUserParams): Promise<AskUserResult> {
    try {
      const question = service.ask(toAskUserCommand(parseRequest(askUserRequestSchema, params)));
      return Promise.resolve(toWireUserQuestion(question));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const askUserHandler = createAskUserHandler();
