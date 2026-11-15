import type { GetHotbarParams, GetHotbarResult } from '@/commands/types';
import { createFoundryHotbarService, getHotbarRequestSchema, toGetHotbarQuery, type HotbarWiring } from '@/core/macros';
import { parseRequest } from '@/core/shared';
import { toWireHotbar } from './hotbarWireMappers';

export type HotbarHandlerDependencies = HotbarWiring;

export function createGetHotbarHandler(
  deps: HotbarHandlerDependencies = {}
): (params: GetHotbarParams) => Promise<GetHotbarResult> {
  const service = createFoundryHotbarService(deps);

  return function getHotbarHandler(params: GetHotbarParams): Promise<GetHotbarResult> {
    try {
      const view = service.getHotbar(toGetHotbarQuery(parseRequest(getHotbarRequestSchema, params)));
      return Promise.resolve({ ...toWireHotbar(view.hotbar), page: view.page });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getHotbarHandler = createGetHotbarHandler();
