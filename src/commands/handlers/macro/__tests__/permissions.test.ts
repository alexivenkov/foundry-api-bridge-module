import { ensureScriptMacroAllowed } from '../permissions';
import { getAllowScriptMacros } from '@/settings/SettingsManager';

jest.mock('@/settings/SettingsManager');

const mockGetAllowScriptMacros = getAllowScriptMacros as jest.MockedFunction<typeof getAllowScriptMacros>;

describe('ensureScriptMacroAllowed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not throw for chat macros regardless of flag', () => {
    mockGetAllowScriptMacros.mockReturnValue(false);
    expect(() => ensureScriptMacroAllowed('chat')).not.toThrow();

    mockGetAllowScriptMacros.mockReturnValue(true);
    expect(() => ensureScriptMacroAllowed('chat')).not.toThrow();
  });

  it('should throw for script macros when flag is false', () => {
    mockGetAllowScriptMacros.mockReturnValue(false);

    expect(() => ensureScriptMacroAllowed('script'))
      .toThrow('Script macros are disabled. Enable "Allow Script Macros" in module settings to manage script-type macros via API.');
  });

  it('should not throw for script macros when flag is true', () => {
    mockGetAllowScriptMacros.mockReturnValue(true);

    expect(() => ensureScriptMacroAllowed('script')).not.toThrow();
  });

  it('should not call setting getter for chat macros (early exit)', () => {
    mockGetAllowScriptMacros.mockReturnValue(false);

    ensureScriptMacroAllowed('chat');

    expect(mockGetAllowScriptMacros).not.toHaveBeenCalled();
  });
});
