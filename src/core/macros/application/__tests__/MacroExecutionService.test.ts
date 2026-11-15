import {
  InvalidMacroArgumentsError,
  MACRO_RESULT_MAX_BYTES,
  MacroActorNotFoundError,
  MacroExecutionFailedError,
  MacroNotFoundError,
  MacroSyntaxError,
  MacroTokenNotFoundError,
  ScriptMacrosDisabledError
} from '../../domain';
import { MacroExecutionService } from '../MacroExecutionService';
import type { ExecuteMacroCommand } from '../commands';
import { FakeMacroRunner, FakeMacroStore, FakeScriptPolicy, macro } from './fakePorts';

interface Setup {
  service: MacroExecutionService;
  store: FakeMacroStore;
  scripts: FakeScriptPolicy;
  runner: FakeMacroRunner;
}

function setup(options: { allowed?: boolean } = {}): Setup {
  const store = new FakeMacroStore([
    macro({ id: 'hello', name: 'Hello', type: 'chat', command: 'return (' }),
    macro({ id: 'strike', name: 'Strike', type: 'script', command: 'return args' })
  ]);
  const scripts = new FakeScriptPolicy(options.allowed ?? true);
  const runner = new FakeMacroRunner();
  runner.actorIds = ['hero'];
  runner.canvasTokenIds = ['pawn'];
  return { service: new MacroExecutionService({ macros: store, scripts, runner }), store, scripts, runner };
}

function command(overrides: Partial<ExecuteMacroCommand> = {}): ExecuteMacroCommand {
  return { macroId: 'strike', actorId: undefined, tokenId: undefined, args: undefined, ...overrides };
}

describe('MacroExecutionService', () => {
  describe('running', () => {
    it('runs a script macro and reports it with its JSON-safe result', async () => {
      const { service, runner } = setup();
      runner.returns = { hit: true, when: new Date('2026-10-30T12:00:00.000Z') };

      const execution = await service.executeMacro(command());

      expect(runner.runs).toEqual([
        { macroId: 'strike', context: { actorId: undefined, tokenId: undefined, args: undefined } }
      ]);
      expect(execution.macro).toMatchObject({ id: 'strike', name: 'Strike', type: 'script' });
      expect(execution.result).toEqual({ result: { hit: true, when: '2026-10-30T12:00:00.000Z' } });
    });

    it('hands the actor, the token and the arguments to the runner', async () => {
      const { service, runner } = setup();
      const args = { advantage: true };

      await service.executeMacro(command({ actorId: 'hero', tokenId: 'pawn', args }));

      const context = runner.runs[0]?.context;
      expect(context).toEqual({ actorId: 'hero', tokenId: 'pawn', args });
      expect(context?.args).toBe(args);
    });

    it('reports no result at all for a macro that returned nothing', async () => {
      const { service } = setup();

      expect((await service.executeMacro(command())).result).toEqual({});
    });

    it('reports only the size of a result over the cap', async () => {
      const { service, runner } = setup();
      runner.returns = 'x'.repeat(MACRO_RESULT_MAX_BYTES);

      expect((await service.executeMacro(command())).result).toEqual({
        resultTruncated: true,
        resultBytes: MACRO_RESULT_MAX_BYTES + 2
      });
    });

    it('runs a chat macro without the script permission and without a syntax check', async () => {
      const { service, runner, scripts } = setup({ allowed: false });

      const execution = await service.executeMacro(command({ macroId: 'hello', args: { ignored: true } }));

      expect(execution.macro.type).toBe('chat');
      expect(runner.calls).toEqual(['run:hello']);
      expect(scripts.asked).toBe(0);
    });
  });

  describe('order of the checks', () => {
    it('checks a script in the contract order: syntax, actor, token, and only then runs', async () => {
      const { service, runner } = setup();

      await service.executeMacro(command({ actorId: 'hero', tokenId: 'pawn', args: {} }));

      expect(runner.calls).toEqual(['syntax:return args', 'actor:hero', 'token:pawn', 'run:strike']);
    });

    it('reports an unknown macro before anything else', async () => {
      const { service, runner, scripts } = setup({ allowed: false });

      await expect(service.executeMacro(command({ macroId: 'missing', args: 'x', actorId: 'nobody' })))
        .rejects.toThrow(MacroNotFoundError);
      expect(scripts.asked).toBe(0);
      expect(runner.calls).toEqual([]);
    });

    it('reports disabled script macros before bad arguments', async () => {
      const { service, runner } = setup({ allowed: false });

      await expect(service.executeMacro(command({ args: 'x' }))).rejects.toThrow(ScriptMacrosDisabledError);
      expect(runner.calls).toEqual([]);
    });

    it.each([
      ['an array', []],
      ['null', null],
      ['a string', 'x'],
      ['a number', 1],
      ['a boolean', false]
    ])('reports %s as arguments before the syntax, the actor and the token', async (_case, args) => {
      const { service, runner } = setup();
      runner.syntaxError = 'Unexpected end of input';

      const run = service.executeMacro(command({ args, actorId: 'nobody', tokenId: 'nothing' }));

      await expect(run).rejects.toThrow(InvalidMacroArgumentsError);
      await expect(run).rejects.toThrow('args must be a JSON object');
      expect(runner.calls).toEqual([]);
    });

    it('rejects bad arguments for a chat macro too, although it would ignore good ones', async () => {
      const { service, runner } = setup();

      await expect(service.executeMacro(command({ macroId: 'hello', args: 'x' })))
        .rejects.toThrow('args must be a JSON object');
      expect(runner.calls).toEqual([]);
    });

    it('reports a script that does not compile before looking for the actor', async () => {
      const { service, runner } = setup();
      runner.syntaxError = 'Unexpected end of input';

      const run = service.executeMacro(command({ actorId: 'nobody' }));

      await expect(run).rejects.toThrow(MacroSyntaxError);
      await expect(run).rejects.toThrow('Macro "Strike" has a syntax error: Unexpected end of input');
      expect(runner.calls).toEqual(['syntax:return args']);
    });

    it('reports an unknown actor before looking for the token', async () => {
      const { service, runner } = setup();

      const run = service.executeMacro(command({ actorId: 'nobody', tokenId: 'nothing' }));

      await expect(run).rejects.toThrow(MacroActorNotFoundError);
      await expect(run).rejects.toThrow('Actor not found: nobody');
      expect(runner.calls).toEqual(['syntax:return args', 'actor:nobody']);
    });

    it('reports a token that is not on the canvas without running the macro', async () => {
      const { service, runner } = setup();

      const run = service.executeMacro(command({ actorId: 'hero', tokenId: 'nothing' }));

      await expect(run).rejects.toThrow(MacroTokenNotFoundError);
      await expect(run).rejects.toThrow('Token not found on active scene: nothing');
      expect(runner.runs).toEqual([]);
    });
  });

  describe('a run that fails', () => {
    it('names the macro and what it threw', async () => {
      const { service, runner } = setup();
      runner.rejectsWith = { thrown: new Error('boom') };

      const run = service.executeMacro(command());

      await expect(run).rejects.toThrow(MacroExecutionFailedError);
      await expect(run).rejects.toThrow('Macro "Strike" failed: boom');
    });

    it('reads a thrown string as it is', async () => {
      const { service, runner } = setup();
      runner.rejectsWith = { thrown: 'nope' };

      await expect(service.executeMacro(command())).rejects.toThrow('Macro "Strike" failed: nope');
    });
  });

  describe('a macro that changes itself while running', () => {
    it('is reported under the name and type the run left it with', async () => {
      const { service, store, runner } = setup();
      runner.whileRunning = (): void => {
        store.replace(macro({ id: 'strike', name: 'Strike II', type: 'chat' }));
      };

      const execution = await service.executeMacro(command());

      expect(execution.macro).toMatchObject({ name: 'Strike II', type: 'chat' });
    });

    it('is named as renamed in the failure text', async () => {
      const { service, store, runner } = setup();
      runner.whileRunning = (): void => {
        store.replace(macro({ id: 'strike', name: 'Strike II', type: 'script' }));
      };
      runner.rejectsWith = { thrown: new Error('boom') };

      await expect(service.executeMacro(command())).rejects.toThrow('Macro "Strike II" failed: boom');
    });

    it('is still reported after it deleted itself', async () => {
      const { service, store, runner } = setup();
      runner.whileRunning = (): void => {
        store.remove('strike');
      };
      runner.returns = 'gone';

      const execution = await service.executeMacro(command());

      expect(execution).toEqual({ macro: expect.objectContaining({ id: 'strike', name: 'Strike' }), result: { result: 'gone' } });
    });
  });
});
