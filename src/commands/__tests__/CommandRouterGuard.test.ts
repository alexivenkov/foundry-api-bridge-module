import { CommandRouter } from '../CommandRouter';
import { createScriptMarkerGuard } from '../scriptMarkerGuard';
import type { Command } from '../types';

function rollCommand(formula: string): Command {
  return { id: 'c1', type: 'roll-dice', params: { formula } };
}

function routerWith(allowsScripts: boolean): { router: CommandRouter; handler: jest.Mock; asked: jest.Mock } {
  const asked = jest.fn(() => allowsScripts);
  const router = new CommandRouter({ guard: createScriptMarkerGuard(asked) });
  const handler = jest.fn().mockResolvedValue({ total: 4 });
  router.register('roll-dice', handler);
  return { router, handler, asked };
}

describe('CommandRouter guard', () => {
  it('refuses a command carrying the DAE marker without the opt-in, before the handler runs', async () => {
    const { router, handler } = routerWith(false);

    const response = await router.execute(rollCommand('1d20 + dae.eval(1)'));

    expect(response).toEqual({
      id: 'c1',
      success: false,
      error:
        'Script macros are disabled: params.formula makes DAE run JavaScript. ' +
        'Enable "Allow Script Macros" in module settings to write it via API.'
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('lets it through with the opt-in', async () => {
    const { router, handler } = routerWith(true);

    const response = await router.execute(rollCommand('dae.eval(1)'));

    expect(response).toEqual({ id: 'c1', success: true, data: { total: 4 } });
    expect(handler).toHaveBeenCalledWith({ formula: 'dae.eval(1)' });
  });

  it('does not read the setting for an ordinary command', async () => {
    const { router, handler, asked } = routerWith(false);

    await router.execute(rollCommand('2d6'));

    expect(asked).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalled();
  });

  it('still reports an unknown command type as before', async () => {
    const { router } = routerWith(false);

    await expect(
      router.execute({ id: 'c2', type: 'no-such-command' as Command['type'], params: { formula: 'dae.eval(1)' } })
    ).resolves.toEqual({ id: 'c2', success: false, error: 'Unknown command type: no-such-command' });
  });

  it('runs without a guard as it always did', async () => {
    const router = new CommandRouter();
    router.register('roll-dice', jest.fn().mockResolvedValue({ total: 1 }));

    await expect(router.execute(rollCommand('dae.eval(1)'))).resolves.toMatchObject({ success: true });
  });
});
