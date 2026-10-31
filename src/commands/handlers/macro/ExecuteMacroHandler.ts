import type { ExecuteMacroParams, ExecuteMacroResult } from '@/commands/types';
import { getGame, getCanvas } from './macroTypes';
import type { FoundryMacroDoc } from './macroTypes';
import { ensureScriptMacroAllowed } from './permissions';
import { serializeMacroResult } from './serializeMacroResult';

type AsyncFunctionConstructor = new (...source: string[]) => unknown;

async function asyncProbe(): Promise<void> {
  await Promise.resolve();
}

const AsyncFunction = (Object.getPrototypeOf(asyncProbe) as { constructor: AsyncFunctionConstructor }).constructor;

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function ensureScriptCompiles(macro: FoundryMacroDoc): void {
  try {
    new AsyncFunction(`{${macro.command}\n}`);
  } catch (error) {
    throw new Error(`Macro "${macro.name}" has a syntax error: ${messageOf(error)}`);
  }
}

export async function executeMacroHandler(params: ExecuteMacroParams): Promise<ExecuteMacroResult> {
  const macro = getGame().macros.get(params.macroId);
  if (!macro) {
    throw new Error(`Macro not found: ${params.macroId}`);
  }

  ensureScriptMacroAllowed(macro.type);

  const args: unknown = params.args;
  if (args !== undefined && !isJsonObject(args)) {
    throw new Error('args must be a JSON object');
  }

  if (macro.type === 'script') {
    ensureScriptCompiles(macro);
  }

  const scope: Record<string, unknown> = {};

  if (params.actorId !== undefined) {
    const actor = getGame().actors.get(params.actorId);
    if (!actor) {
      throw new Error(`Actor not found: ${params.actorId}`);
    }
    scope['actor'] = actor;
  }

  if (params.tokenId !== undefined) {
    const canvas = getCanvas();
    const token = canvas?.scene?.tokens.get(params.tokenId);
    if (!token) {
      throw new Error(`Token not found on active scene: ${params.tokenId}`);
    }
    scope['token'] = token;
  }

  if (args !== undefined) {
    scope['args'] = args;
  }

  let value: unknown;
  try {
    value = await macro.execute(scope);
  } catch (error) {
    throw new Error(`Macro "${macro.name}" failed: ${messageOf(error)}`);
  }

  return {
    executed: true,
    macroId: params.macroId,
    macroName: macro.name,
    macroType: macro.type,
    ...serializeMacroResult(value)
  };
}
