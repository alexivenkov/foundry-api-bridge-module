import { getAllowScriptMacros } from '../../../../settings/SettingsManager';
import { moduleSettingScriptMacroPolicy } from '../moduleSettingScriptMacroPolicy';

jest.mock('../../../../settings/SettingsManager');

const setting = getAllowScriptMacros as jest.MockedFunction<typeof getAllowScriptMacros>;

describe('moduleSettingScriptMacroPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([true, false])('answers with the module setting (%s)', (allowed) => {
    setting.mockReturnValue(allowed);

    expect(moduleSettingScriptMacroPolicy.allowsScriptMacros()).toBe(allowed);
  });

  it('reads the setting on every check, so a change by the GM takes effect at once', () => {
    setting.mockReturnValueOnce(false).mockReturnValueOnce(true);

    expect(moduleSettingScriptMacroPolicy.allowsScriptMacros()).toBe(false);
    expect(moduleSettingScriptMacroPolicy.allowsScriptMacros()).toBe(true);
    expect(setting).toHaveBeenCalledTimes(2);
  });

  it('does not read the setting until it is asked', () => {
    expect(setting).not.toHaveBeenCalled();
  });
});
