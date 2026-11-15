import { createCreateMacroHandler } from '../CreateMacroHandler';

const mockCreate = jest.fn();

describe('create-macro — chat macros whose rolls DAE evaluates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, unknown>)['Macro'] = { create: mockCreate };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['Macro'];
  });

  it('refuses dae.eval in a chat command without the opt-in and creates it with the opt-in', async () => {
    const params = { name: 'Sneaky', type: 'chat' as const, command: '/r 1d20 + dae.eval(globalThis.x)' };

    await expect(createCreateMacroHandler({ scripts: { allowsScriptMacros: () => false } })(params)).rejects.toThrow(
      'Script macros are disabled: command makes DAE run JavaScript. ' +
        'Enable "Allow Script Macros" in module settings to write it via API.'
    );
    expect(mockCreate).not.toHaveBeenCalled();

    mockCreate.mockResolvedValue({
      id: 'm1',
      uuid: 'Macro.m1',
      name: 'Sneaky',
      type: 'chat',
      img: 'icons/svg/dice-target.svg',
      command: params.command,
      scope: 'global',
      folder: null,
      author: null
    });
    await expect(createCreateMacroHandler({ scripts: { allowsScriptMacros: () => true } })(params)).resolves.toMatchObject({
      id: 'm1'
    });
  });
});
