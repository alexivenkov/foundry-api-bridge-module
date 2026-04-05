import type { DeleteRollTableParams, DeleteResult } from '@/commands/types';
import { getGame } from './tableTypes';

export async function deleteRollTableHandler(params: DeleteRollTableParams): Promise<DeleteResult> {
  const table = getGame().tables.get(params.tableId);

  if (!table) {
    throw new Error(`Roll table not found: ${params.tableId}`);
  }

  await table.delete();

  return { deleted: true };
}
