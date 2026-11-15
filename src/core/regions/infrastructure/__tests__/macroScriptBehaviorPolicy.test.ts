import { getAllowScriptMacros } from '../../../../settings/SettingsManager';
import { macroScriptBehaviorPolicy } from '../macroScriptBehaviorPolicy';

jest.mock('../../../../settings/SettingsManager', () => ({ getAllowScriptMacros: jest.fn() }));

describe('macroScriptBehaviorPolicy', () => {
  it('follows the "Allow Script Macros" setting on every check', () => {
    const setting = getAllowScriptMacros as jest.Mock;
    setting.mockReturnValue(false);
    expect(macroScriptBehaviorPolicy.allowsScripts()).toBe(false);
    setting.mockReturnValue(true);
    expect(macroScriptBehaviorPolicy.allowsScripts()).toBe(true);
    expect(setting).toHaveBeenCalledTimes(2);
  });
});
