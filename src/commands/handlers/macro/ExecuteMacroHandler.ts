import type { ExecuteMacroParams, ExecuteMacroResult } from '@/commands/types';
import { getGame, getCanvas } from './macroTypes';
import { ensureScriptMacroAllowed } from './permissions';

export async function executeMacroHandler(params: ExecuteMacroParams): Promise<ExecuteMacroResult> {
  const macro = getGame().macros.get(params.macroId);
  if (!macro) {
    throw new Error(`Macro not found: ${params.macroId}`);
  }

  ensureScriptMacroAllowed(macro.type);

  const scope: { actor?: object; token?: object } = {};

  if (params.actorId !== undefined) {
    const actor = getGame().actors.get(params.actorId);
    if (!actor) {
      throw new Error(`Actor not found: ${params.actorId}`);
    }
    scope.actor = actor;
  }

  if (params.tokenId !== undefined) {
    const canvas = getCanvas();
    const token = canvas?.scene?.tokens.get(params.tokenId);
    if (!token) {
      throw new Error(`Token not found on active scene: ${params.tokenId}`);
    }
    scope.token = token;
  }

  await macro.execute(scope);

  return {
    executed: true,
    macroId: params.macroId,
    macroName: macro.name,
    macroType: macro.type
  };
}
