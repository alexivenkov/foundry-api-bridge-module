import { foundryGeneration } from '@/compat/foundryVersion';
import {
  MacroNotFoundError,
  describeThrown,
  type MacroRunContext,
  type MacroRunner
} from '@/core/macros/domain';
import {
  macroGlobalsFromGlobalThis,
  type FoundryMacroGlobals,
  type MacroGlobalsProvider
} from './foundryMacroTypes';

type AsyncFunctionConstructor = new (...source: string[]) => unknown;

async function asyncProbe(): Promise<void> {
  await Promise.resolve();
}

// The AsyncFunction intrinsic has no global name; it is reached through any async function.
const AsyncFunction = (Object.getPrototypeOf(asyncProbe) as { constructor: AsyncFunctionConstructor }).constructor;

// What a macro is told about the actor and the token it runs for was read in
// `Macro#execute` and its callers of cores 13.351 and 14.368. Cores 11 and 12
// were not at hand: on them the scope stays what this command has always passed.
const ADDRESSED_SCOPE_MIN_GENERATION = 13;

function keepsLegacyScope(): boolean {
  const generation = foundryGeneration();
  return generation > 0 && generation < ADDRESSED_SCOPE_MIN_GENERATION;
}

/**
 * The scope the core's own caller of `Macro#execute` builds for a token
 * (`ExecuteMacroRegionBehaviorType`): the Token placeable, its actor and a
 * speaker. A chat macro reads nothing but the speaker. A script would derive
 * one itself, but from a placeable the core derives a speaker without a scene,
 * so the speaker is always built here, from the token's document.
 */
function addressedScope(globals: FoundryMacroGlobals, context: MacroRunContext): Record<string, unknown> {
  const token = context.tokenId !== undefined ? globals.canvas?.tokens?.get(context.tokenId) : undefined;
  const actor = context.actorId !== undefined ? globals.game.actors.get(context.actorId) : token?.actor;

  const scope: Record<string, unknown> = {};
  if (actor) {
    scope['actor'] = actor;
  }
  if (token) {
    scope['token'] = token;
  }
  if (actor || token) {
    scope['speaker'] = globals.ChatMessage.implementation.getSpeaker({ actor, token: token?.document });
  }
  return scope;
}

function legacyScope(globals: FoundryMacroGlobals, context: MacroRunContext): Record<string, unknown> {
  const scope: Record<string, unknown> = {};
  if (context.actorId !== undefined) {
    scope['actor'] = globals.game.actors.get(context.actorId);
  }
  if (context.tokenId !== undefined) {
    scope['token'] = globals.canvas?.scene?.tokens.get(context.tokenId);
  }
  return scope;
}

/** Runs macros in the GM's client, the way a click on the hotbar would. */
export class FoundryMacroRunner implements MacroRunner {
  constructor(private readonly globals: MacroGlobalsProvider = macroGlobalsFromGlobalThis) {}

  /**
   * The body is built exactly as the core builds it for a script macro
   * (`{<command>\n}` in an async function), and the function is never called.
   */
  findSyntaxError(script: string): string | null {
    try {
      new AsyncFunction(`{${script}\n}`);
      return null;
    } catch (error) {
      return describeThrown(error);
    }
  }

  hasActor(actorId: string): boolean {
    return Boolean(this.globals().game.actors.get(actorId));
  }

  hasCanvasToken(tokenId: string): boolean {
    const { canvas } = this.globals();
    return Boolean(keepsLegacyScope() ? canvas?.scene?.tokens.get(tokenId) : canvas?.tokens?.get(tokenId));
  }

  async run(macroId: string, context: MacroRunContext): Promise<unknown> {
    const globals = this.globals();
    const macro = globals.game.macros.get(macroId);
    if (!macro) {
      throw new MacroNotFoundError(macroId);
    }

    // Every key of the scope a script does not know becomes one of its variables,
    // so a key exists only for what the caller gave: without `args`, no `args`.
    const scope = keepsLegacyScope() ? legacyScope(globals, context) : addressedScope(globals, context);
    if (context.args !== undefined) {
      scope['args'] = context.args;
    }

    return macro.execute(scope);
  }
}
