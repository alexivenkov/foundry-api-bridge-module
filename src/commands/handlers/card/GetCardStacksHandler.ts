import type { GetCardStacksParams, GetCardStacksResult } from '@/commands/types';
import {
  createFoundryCardStackService,
  getCardStacksRequestSchema,
  toListCardStacksQuery,
  type CardGlobalsProvider,
  type ScriptCarrierPolicy
} from '@/core/cards';
import { parseRequest } from '@/core/shared';
import { toWireCardStackSummary } from './cardWireMappers';

export interface CardHandlerDependencies {
  globals?: CardGlobalsProvider;
  scripts?: ScriptCarrierPolicy;
}

export function createGetCardStacksHandler(
  deps: CardHandlerDependencies = {}
): (params: GetCardStacksParams) => Promise<GetCardStacksResult> {
  const service = createFoundryCardStackService(deps.globals);

  return function getCardStacksHandler(params: GetCardStacksParams): Promise<GetCardStacksResult> {
    try {
      const result = service.listStacks(toListCardStacksQuery(parseRequest(getCardStacksRequestSchema, params)));
      return Promise.resolve({ cardStacks: result.map(toWireCardStackSummary) });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getCardStacksHandler = createGetCardStacksHandler();
