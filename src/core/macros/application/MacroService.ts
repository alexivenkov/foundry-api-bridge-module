import { refuseNewScriptCarriers } from '@/kernel';
import {
  MacroCreationCancelledError,
  MacroNotFoundError,
  requireScriptMacrosAllowed,
  type Macro,
  type MacroStore,
  type ScriptMacroPolicy
} from '@/core/macros/domain';
import type {
  CreateMacroCommand,
  DeleteMacroCommand,
  GetMacroQuery,
  ListMacrosQuery,
  UpdateMacroCommand
} from './commands';

export interface MacroServiceDependencies {
  readonly macros: MacroStore;
  readonly scripts: ScriptMacroPolicy;
}

export class MacroService {
  constructor(private readonly deps: MacroServiceDependencies) {}

  listMacros(query: ListMacrosQuery): readonly Macro[] {
    const macros = this.deps.macros.listMacros();
    return query.type === undefined ? macros : macros.filter((macro) => macro.type === query.type);
  }

  getMacro(query: GetMacroQuery): Macro {
    return this.requireMacro(query.macroId);
  }

  async createMacro(command: CreateMacroCommand): Promise<Macro> {
    requireScriptMacrosAllowed(command.draft.type, this.deps.scripts);
    refuseNewScriptCarriers('Macro', command.draft, () => this.deps.scripts.allowsScriptMacros());
    const macro = await this.deps.macros.createMacro(command.draft);
    if (macro === null) {
      throw new MacroCreationCancelledError();
    }
    return macro;
  }

  /** Both ends of a change are guarded: a script macro may not be touched, and nothing may become one. */
  async updateMacro(command: UpdateMacroCommand): Promise<Macro> {
    const macro = this.requireMacro(command.macroId);
    requireScriptMacrosAllowed(macro.type, this.deps.scripts);
    requireScriptMacrosAllowed(command.changes.type, this.deps.scripts);
    // A chat macro runs its command as chat input: DAE evaluates `dae.eval(` in its rolls.
    refuseNewScriptCarriers('Macro', command.changes, () => this.deps.scripts.allowsScriptMacros(), () => macro);

    const updated = await this.deps.macros.updateMacro(command.macroId, command.changes);
    if (updated === null) {
      throw new MacroNotFoundError(command.macroId);
    }
    return updated;
  }

  /** Deleting is not guarded: removing a script macro runs nothing. */
  async deleteMacro(command: DeleteMacroCommand): Promise<void> {
    this.requireMacro(command.macroId);
    await this.deps.macros.deleteMacro(command.macroId);
  }

  private requireMacro(macroId: string): Macro {
    const macro = this.deps.macros.findMacro(macroId);
    if (macro === null) {
      throw new MacroNotFoundError(macroId);
    }
    return macro;
  }
}
