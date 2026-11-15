import {
  InvalidMacroArgumentsError,
  MacroActorNotFoundError,
  MacroExecutionFailedError,
  MacroNotFoundError,
  MacroSyntaxError,
  MacroTokenNotFoundError,
  describeThrown,
  isMacroArguments,
  requireScriptMacrosAllowed,
  serializeMacroResult,
  type Macro,
  type MacroArguments,
  type MacroRunner,
  type MacroStore,
  type ScriptMacroPolicy,
  type SerializedMacroResult
} from '@/core/macros/domain';
import type { ExecuteMacroCommand } from './commands';

export interface MacroExecutionServiceDependencies {
  readonly macros: MacroStore;
  readonly scripts: ScriptMacroPolicy;
  readonly runner: MacroRunner;
}

export interface MacroExecution {
  readonly macro: Macro;
  readonly result: SerializedMacroResult;
}

export class MacroExecutionService {
  constructor(private readonly deps: MacroExecutionServiceDependencies) {}

  /**
   * The order of the checks is part of the wire contract: the macro, the script
   * permission, the arguments, the script's syntax, the actor, the token — and
   * only then the run.
   */
  async executeMacro(command: ExecuteMacroCommand): Promise<MacroExecution> {
    const macro = this.requireMacro(command.macroId);
    requireScriptMacrosAllowed(macro.type, this.deps.scripts);
    const args = requireArguments(command.args);
    this.requireCompilableScript(macro);
    this.requireSpeaker(command);

    let returned: unknown;
    try {
      returned = await this.deps.runner.run(macro.id, {
        actorId: command.actorId,
        tokenId: command.tokenId,
        args
      });
    } catch (error) {
      throw new MacroExecutionFailedError(this.afterRun(macro).name, describeThrown(error));
    }

    return { macro: this.afterRun(macro), result: serializeMacroResult(returned) };
  }

  private requireMacro(macroId: string): Macro {
    const macro = this.deps.macros.findMacro(macroId);
    if (macro === null) {
      throw new MacroNotFoundError(macroId);
    }
    return macro;
  }

  /** A script that does not compile is refused before it can half-run; a chat macro is plain text. */
  private requireCompilableScript(macro: Macro): void {
    if (macro.type !== 'script') {
      return;
    }
    const syntaxError = this.deps.runner.findSyntaxError(macro.command);
    if (syntaxError !== null) {
      throw new MacroSyntaxError(macro.name, syntaxError);
    }
  }

  private requireSpeaker(command: ExecuteMacroCommand): void {
    if (command.actorId !== undefined && !this.deps.runner.hasActor(command.actorId)) {
      throw new MacroActorNotFoundError(command.actorId);
    }
    if (command.tokenId !== undefined && !this.deps.runner.hasCanvasToken(command.tokenId)) {
      throw new MacroTokenNotFoundError(command.tokenId);
    }
  }

  /** A script may rename, retype or delete its own macro: it is reported as the run left it. */
  private afterRun(macro: Macro): Macro {
    return this.deps.macros.findMacro(macro.id) ?? macro;
  }
}

function requireArguments(args: unknown): MacroArguments | undefined {
  if (args === undefined) {
    return undefined;
  }
  if (!isMacroArguments(args)) {
    throw new InvalidMacroArgumentsError();
  }
  return args;
}
