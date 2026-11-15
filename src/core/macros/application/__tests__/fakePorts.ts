import type {
  Macro,
  MacroChanges,
  MacroDraft,
  MacroRunContext,
  MacroRunner,
  MacroStore,
  ScriptMacroPolicy
} from '../../domain';

export function macro(overrides: Partial<Macro> = {}): Macro {
  return {
    id: 'm1',
    uuid: 'Macro.m1',
    name: 'Greeting',
    type: 'chat',
    img: 'icons/svg/dice-target.svg',
    command: '/r 1d20',
    scope: 'global',
    folderName: null,
    authorId: null,
    ...overrides
  };
}

export class FakeMacroStore implements MacroStore {
  readonly created: MacroDraft[] = [];
  readonly updated: Array<{ macroId: string; changes: MacroChanges }> = [];
  readonly deleted: string[] = [];
  createsNothing = false;
  losesMacroOnUpdate = false;

  private readonly macros: Macro[];

  constructor(macros: readonly Macro[] = []) {
    this.macros = [...macros];
  }

  listMacros(): readonly Macro[] {
    return this.macros;
  }

  findMacro(macroId: string): Macro | null {
    return this.macros.find((candidate) => candidate.id === macroId) ?? null;
  }

  createMacro(draft: MacroDraft): Promise<Macro | null> {
    this.created.push(draft);
    return Promise.resolve(
      this.createsNothing ? null : macro({ id: 'created', name: draft.name, type: draft.type ?? 'chat' })
    );
  }

  updateMacro(macroId: string, changes: MacroChanges): Promise<Macro | null> {
    this.updated.push({ macroId, changes });
    const current = this.findMacro(macroId);
    if (current === null || this.losesMacroOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve(this.replace({ ...current, ...(changes.name !== undefined ? { name: changes.name } : {}) }));
  }

  deleteMacro(macroId: string): Promise<void> {
    this.deleted.push(macroId);
    this.remove(macroId);
    return Promise.resolve();
  }

  replace(next: Macro): Macro {
    const index = this.macros.findIndex((candidate) => candidate.id === next.id);
    this.macros[index] = next;
    return next;
  }

  remove(macroId: string): void {
    const index = this.macros.findIndex((candidate) => candidate.id === macroId);
    if (index >= 0) {
      this.macros.splice(index, 1);
    }
  }
}

export class FakeScriptPolicy implements ScriptMacroPolicy {
  asked = 0;

  constructor(public allowed: boolean) {}

  allowsScriptMacros(): boolean {
    this.asked += 1;
    return this.allowed;
  }
}

export class FakeMacroRunner implements MacroRunner {
  readonly calls: string[] = [];
  readonly runs: Array<{ macroId: string; context: MacroRunContext }> = [];
  syntaxError: string | null = null;
  actorIds: string[] = [];
  canvasTokenIds: string[] = [];
  returns: unknown = undefined;
  whileRunning: (() => void) | undefined;
  rejectsWith: { thrown: unknown } | undefined;

  findSyntaxError(script: string): string | null {
    this.calls.push(`syntax:${script}`);
    return this.syntaxError;
  }

  hasActor(actorId: string): boolean {
    this.calls.push(`actor:${actorId}`);
    return this.actorIds.includes(actorId);
  }

  hasCanvasToken(tokenId: string): boolean {
    this.calls.push(`token:${tokenId}`);
    return this.canvasTokenIds.includes(tokenId);
  }

  run(macroId: string, context: MacroRunContext): Promise<unknown> {
    this.calls.push(`run:${macroId}`);
    this.runs.push({ macroId, context });
    this.whileRunning?.();
    if (this.rejectsWith !== undefined) {
      return Promise.reject(this.rejectsWith.thrown);
    }
    return Promise.resolve(this.returns);
  }
}
