import type { CreateMacroParams, CreateMacroResult } from '@/commands/types';
import { getMacroClass, mapMacroToDetail } from './macroTypes';
import { ensureScriptMacroAllowed } from './permissions';

export async function createMacroHandler(params: CreateMacroParams): Promise<CreateMacroResult> {
  ensureScriptMacroAllowed(params.type);

  const data: Record<string, unknown> = {
    name: params.name,
    type: params.type,
    command: params.command
  };

  if (params.scope !== undefined) {
    data['scope'] = params.scope;
  }

  if (params.img !== undefined) {
    data['img'] = params.img;
  }

  if (params.folder !== undefined) {
    data['folder'] = params.folder;
  }

  const macro = await getMacroClass().create(data);
  return mapMacroToDetail(macro);
}
