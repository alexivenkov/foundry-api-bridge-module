import type { DeleteMacroParams, DeleteMacroResult } from '@/commands/types';
import { getGame } from './macroTypes';

export async function deleteMacroHandler(params: DeleteMacroParams): Promise<DeleteMacroResult> {
  const macro = getGame().macros.get(params.macroId);
  if (!macro) {
    throw new Error(`Macro not found: ${params.macroId}`);
  }

  await macro.delete();

  return {
    deleted: true,
    macroId: params.macroId
  };
}
