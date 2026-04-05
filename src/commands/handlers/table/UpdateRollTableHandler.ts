import type { UpdateRollTableParams, RollTableResult } from '@/commands/types';
import { getGame, mapTableToResult } from './tableTypes';

export async function updateRollTableHandler(params: UpdateRollTableParams): Promise<RollTableResult> {
  const table = getGame().tables.get(params.tableId);

  if (!table) {
    throw new Error(`Roll table not found: ${params.tableId}`);
  }

  const updateData: Record<string, unknown> = {};

  if (params.name !== undefined) {
    updateData['name'] = params.name;
  }

  if (params.formula !== undefined) {
    updateData['formula'] = params.formula;
  }

  if (params.replacement !== undefined) {
    updateData['replacement'] = params.replacement;
  }

  if (params.displayRoll !== undefined) {
    updateData['displayRoll'] = params.displayRoll;
  }

  if (params.description !== undefined) {
    updateData['description'] = params.description;
  }

  if (params.img !== undefined) {
    updateData['img'] = params.img;
  }

  const updated = await table.update(updateData);
  return mapTableToResult(updated);
}
