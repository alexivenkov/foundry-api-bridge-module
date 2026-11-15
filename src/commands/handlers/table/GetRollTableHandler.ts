import type { GetRollTableParams, RollTableResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryRollTableService, getRollTableRequestSchema, toGetRollTableQuery } from '@/core/tables';
import { toWireRollTable, type RollTableHandlerDependencies } from './tableWireMappers';

export function createGetRollTableHandler(
  deps: RollTableHandlerDependencies = {}
): (params: GetRollTableParams) => Promise<RollTableResult> {
  const service = createFoundryRollTableService(deps.gameProvider);

  return function getRollTableHandler(params: GetRollTableParams): Promise<RollTableResult> {
    try {
      const query = toGetRollTableQuery(parseRequest(getRollTableRequestSchema, params));
      return Promise.resolve(toWireRollTable(service.getTable(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getRollTableHandler = createGetRollTableHandler();
