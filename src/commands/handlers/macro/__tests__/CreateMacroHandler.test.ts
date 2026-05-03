import { createMacroHandler } from '../CreateMacroHandler';
import type { FoundryMacroDoc } from '../macroTypes';
import { getAllowScriptMacros } from '@/settings/SettingsManager';

jest.mock('@/settings/SettingsManager');

const mockGetAllowScriptMacros = getAllowScriptMacros as jest.MockedFunction<typeof getAllowScriptMacros>;
const mockCreate = jest.fn();

function setMacroClass(): void {
  (globalThis as Record<string, unknown>)['Macro'] = {
    create: mockCreate
  };
}

function clearMacroClass(): void {
  delete (globalThis as Record<string, unknown>)['Macro'];
}

function makeReturnedMacro(overrides?: Partial<FoundryMacroDoc>): FoundryMacroDoc {
  return {
    id: 'created-1',
    uuid: 'Macro.created-1',
    name: 'New Macro',
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

describe('createMacroHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMacroClass();
  });

  afterEach(clearMacroClass);

  it('should create chat macro when allowScriptMacros=false', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    mockCreate.mockResolvedValue(makeReturnedMacro({
      id: 'c1',
      name: 'My Chat',
      type: 'chat',
      command: '/r 1d20'
    }));

    const result = await createMacroHandler({
      name: 'My Chat',
      type: 'chat',
      command: '/r 1d20'
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'My Chat',
      type: 'chat',
      command: '/r 1d20'
    });
    expect(result.id).toBe('c1');
    expect(result.type).toBe('chat');
    expect(result.command).toBe('/r 1d20');
  });

  it('should create chat macro when allowScriptMacros=true', async () => {
    mockGetAllowScriptMacros.mockReturnValue(true);
    mockCreate.mockResolvedValue(makeReturnedMacro({ type: 'chat' }));

    const result = await createMacroHandler({
      name: 'Chat',
      type: 'chat',
      command: '/r 1d6'
    });

    expect(result.type).toBe('chat');
  });

  it('should throw when creating script macro with allowScriptMacros=false', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);

    await expect(createMacroHandler({
      name: 'Bad Script',
      type: 'script',
      command: 'console.log("evil")'
    })).rejects.toThrow(/Script macros are disabled/);

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should create script macro when allowScriptMacros=true', async () => {
    mockGetAllowScriptMacros.mockReturnValue(true);
    mockCreate.mockResolvedValue(makeReturnedMacro({
      id: 's1',
      name: 'Script',
      type: 'script',
      command: 'ui.notifications.info("hi")'
    }));

    const result = await createMacroHandler({
      name: 'Script',
      type: 'script',
      command: 'ui.notifications.info("hi")'
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Script',
      type: 'script',
      command: 'ui.notifications.info("hi")'
    });
    expect(result.type).toBe('script');
  });

  it('should pass all optional fields when provided', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    mockCreate.mockResolvedValue(makeReturnedMacro({
      id: 'full-1',
      name: 'Full',
      type: 'chat',
      img: 'icons/full.png',
      scope: 'actor',
      folder: { id: 'f1', name: 'Folder One' }
    }));

    await createMacroHandler({
      name: 'Full',
      type: 'chat',
      command: '/whisper gm hi',
      scope: 'actor',
      img: 'icons/full.png',
      folder: 'f1'
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Full',
      type: 'chat',
      command: '/whisper gm hi',
      scope: 'actor',
      img: 'icons/full.png',
      folder: 'f1'
    });
  });

  it('should pass folder when provided', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    mockCreate.mockResolvedValue(makeReturnedMacro());

    await createMacroHandler({
      name: 'Foldered',
      type: 'chat',
      command: 'cmd',
      folder: 'folder-id-xyz'
    });

    const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call['folder']).toBe('folder-id-xyz');
  });

  it('should not include optional fields when undefined (defaults applied by Foundry)', async () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    mockCreate.mockResolvedValue(makeReturnedMacro());

    await createMacroHandler({
      name: 'Bare',
      type: 'chat',
      command: '/r 1d4'
    });

    const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('scope');
    expect(call).not.toHaveProperty('img');
    expect(call).not.toHaveProperty('folder');
  });
});
