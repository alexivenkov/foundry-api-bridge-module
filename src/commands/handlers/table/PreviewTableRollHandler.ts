import type { PreviewTableRollParams, PreviewTableRollResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryRollTableManagementService,
  previewTableRollRequestSchema,
  toPreviewTableRollCommand
} from '@/core/tables';
import { toWireTableResult, type RollTableManagementHandlerDependencies } from './tableWireMappers';

export function createPreviewTableRollHandler(
  deps: RollTableManagementHandlerDependencies = {}
): (params: PreviewTableRollParams) => Promise<PreviewTableRollResult> {
  const service = createFoundryRollTableManagementService(deps.gameProvider, deps.rollGlobals);

  return async function previewTableRollHandler(params: PreviewTableRollParams): Promise<PreviewTableRollResult> {
    const command = toPreviewTableRollCommand(parseRequest(previewTableRollRequestSchema, params));
    const { table, draw } = await service.previewRoll(command);
    return {
      tableId: table.id,
      tableName: table.name,
      roll: { formula: draw.formula, total: draw.total },
      results: draw.results.map(toWireTableResult)
    };
  };
}

export const previewTableRollHandler = createPreviewTableRollHandler();
