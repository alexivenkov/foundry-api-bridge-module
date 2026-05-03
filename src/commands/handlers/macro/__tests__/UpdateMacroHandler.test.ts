import { updateMacroHandler } from '../UpdateMacroHandler';
import type { FoundryMacroDoc } from '../macroTypes';
import { getAllowScriptMacros } from '@/settings/SettingsManager';

jest.mock('@/settings/SettingsManager');

const mockGetAllowScriptMacros = getAllowScriptMacros as jest.MockedFunction<typeof getAllowScriptMacros>;

function createMockMacro(overrides?: Partial<FoundryMacroDoc>): FoundryMacroDoc {
  return {
    id: 'm1',
    uuid: 'Macro.m1',
    name: 'Original',
    type: 'chat',
    img: 'icons/svg/dice-target.svg',
    command: '/r 1d20',
    scope: 'global',
    folder: null,
    author: null,
    update: jest.fn(),
    delete: jest.fn(),
    execute: jest.fn(),
    ...overrides
  };
}

function setGame(macros: FoundryMacroDoc[]): void {
  (globalThis as Record<string, unknown>)['game'] = {
    macros: {
      contents: macros,
      get: jest.fn((id: string) => macros.find(m => m.id === id))
    }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('updateMacroHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(clearGame);

  it('should update name on chat macro when allowScriptMacros=false', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ type: 'chat' });
    (macro.update as jest.Mock).mockResolvedValue({ ...macro, name: 'Renamed' });
    setGame([macro]);

    const result = await updateMacroHandler({ macroId: 'm1', name: 'Renamed' });

    expect(macro.update).toHaveBeenCalledWith({ name: 'Renamed' });
    expect(result.name).toBe('Renamed');
  });

  it('should throw when updating script macro and allowScriptMacros=false', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ type: 'script', command: 'console.log(1)' });
    setGame([macro]);

    await expect(updateMacroHandler({ macroId: 'm1', name: 'Renamed Script' }))
      .rejects.toThrow(/Script macros are disabled/);

    expect(macro.update).not.toHaveBeenCalled();
  });

  it('should update name on script macro when allowScriptMacros=true', async () => {
    mockGetAllowScriptMacros.mockReturnValue(true);
    const macro = createMockMacro({ type: 'script', command: 'console.log(1)' });
    (macro.update as jest.Mock).mockResolvedValue({ ...macro, name: 'Renamed Script' });
    setGame([macro]);

    const result = await updateMacroHandler({ macroId: 'm1', name: 'Renamed Script' });

    expect(macro.update).toHaveBeenCalledWith({ name: 'Renamed Script' });
    expect(result.name).toBe('Renamed Script');
  });

  it('should throw when changing chat -> script with allowScriptMacros=false', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ type: 'chat' });
    setGame([macro]);

    await expect(updateMacroHandler({
      macroId: 'm1',
      type: 'script',
      command: 'console.log(1)'
    })).rejects.toThrow(/Script macros are disabled/);

    expect(macro.update).not.toHaveBeenCalled();
  });

  it('should change chat -> script when allowScriptMacros=true', async () => {
    mockGetAllowScriptMacros.mockReturnValue(true);
    const macro = createMockMacro({ type: 'chat' });
    (macro.update as jest.Mock).mockResolvedValue({
      ...macro,
      type: 'script',
      command: 'console.log(1)'
    });
    setGame([macro]);

    const result = await updateMacroHandler({
      macroId: 'm1',
      type: 'script',
      command: 'console.log(1)'
    });

    expect(macro.update).toHaveBeenCalledWith({
      type: 'script',
      command: 'console.log(1)'
    });
    expect(result.type).toBe('script');
  });

  it('should throw when changing script -> chat with allowScriptMacros=false (current type still script)', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ type: 'script' });
    setGame([macro]);

    await expect(updateMacroHandler({
      macroId: 'm1',
      type: 'chat',
      command: '/r 1d20'
    })).rejects.toThrow(/Script macros are disabled/);

    expect(macro.update).not.toHaveBeenCalled();
  });

  it('should change script -> chat when allowScriptMacros=true', async () => {
    mockGetAllowScriptMacros.mockReturnValue(true);
    const macro = createMockMacro({ type: 'script' });
    (macro.update as jest.Mock).mockResolvedValue({
      ...macro,
      type: 'chat',
      command: '/r 1d20'
    });
    setGame([macro]);

    const result = await updateMacroHandler({
      macroId: 'm1',
      type: 'chat',
      command: '/r 1d20'
    });

    expect(result.type).toBe('chat');
  });

  it('should throw when macro not found', async () => {
    mockGetAllowScriptMacros.mockReturnValue(true);
    setGame([]);

    await expect(updateMacroHandler({ macroId: 'missing', name: 'X' }))
      .rejects.toThrow('Macro not found: missing');
  });

  it('should partial update without affecting unspecified fields', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ type: 'chat' });
    (macro.update as jest.Mock).mockResolvedValue(macro);
    setGame([macro]);

    await updateMacroHandler({ macroId: 'm1', img: 'new.png' });

    const call = (macro.update as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(call).toEqual({ img: 'new.png' });
    expect(call).not.toHaveProperty('name');
    expect(call).not.toHaveProperty('type');
    expect(call).not.toHaveProperty('command');
    expect(call).not.toHaveProperty('scope');
    expect(call).not.toHaveProperty('folder');
  });

  it('should update all optional fields together (chat -> chat with allowScriptMacros=false)', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ type: 'chat' });
    (macro.update as jest.Mock).mockResolvedValue({
      ...macro,
      name: 'Renamed',
      type: 'chat',
      command: 'cmd',
      scope: 'actor',
      img: 'new.png',
      folder: { id: 'f1', name: 'F1' }
    });
    setGame([macro]);

    await updateMacroHandler({
      macroId: 'm1',
      name: 'Renamed',
      type: 'chat',
      command: 'cmd',
      scope: 'actor',
      img: 'new.png',
      folder: 'f1'
    });

    expect(macro.update).toHaveBeenCalledWith({
      name: 'Renamed',
      type: 'chat',
      command: 'cmd',
      scope: 'actor',
      img: 'new.png',
      folder: 'f1'
    });
  });

  it('should move to root when folder is null', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    const macro = createMockMacro({ type: 'chat' });
    (macro.update as jest.Mock).mockResolvedValue({ ...macro, folder: null });
    setGame([macro]);

    await updateMacroHandler({ macroId: 'm1', folder: null });

    expect(macro.update).toHaveBeenCalledWith({ folder: null });
  });
});
