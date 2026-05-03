import type { UpdateMacroParams, UpdateMacroResult } from '@/commands/types';
import { getGame, mapMacroToDetail } from './macroTypes';
import { ensureScriptMacroAllowed } from './permissions';

export async function updateMacroHandler(params: UpdateMacroParams): Promise<UpdateMacroResult> {
  const macro = getGame().macros.get(params.macroId);
  if (!macro) {
    throw new Error(`Macro not found: ${params.macroId}`);
  }

  if (macro.type === 'script') {
    ensureScriptMacroAllowed('script');
  }

  if (params.type !== undefined) {
    ensureScriptMacroAllowed(params.type);
  }

  const updateData: Record<string, unknown> = {};

  if (params.name !== undefined) {
    updateData['name'] = params.name;
  }

  if (params.type !== undefined) {
    updateData['type'] = params.type;
  }

  if (params.command !== undefined) {
    updateData['command'] = params.command;
  }

  if (params.scope !== undefined) {
    updateData['scope'] = params.scope;
  }

  if (params.img !== undefined) {
    updateData['img'] = params.img;
  }

  if (params.folder !== undefined) {
    updateData['folder'] = params.folder;
  }

  const updated = await macro.update(updateData);
  return mapMacroToDetail(updated);
}
