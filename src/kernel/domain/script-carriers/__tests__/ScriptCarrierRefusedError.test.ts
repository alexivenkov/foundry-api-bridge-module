import { DomainError } from '../../errors/DomainError';
import { findFlagCarriers, type ScriptCarrier } from '../findScriptCarriers';
import {
  ScriptCarrierRefusedError,
  refuseNewScriptCarriers,
  refuseScriptCarriers,
  scriptCarrierRefusal
} from '../ScriptCarrierRefusedError';
import { splitOverTimeSpec } from '../overTimeSpec';

const carrier: ScriptCarrier = {
  path: 'flags.midi-qol.onUseMacroName',
  module: 'Midi-QOL',
  runs: 'a macro',
  identity: 'x'
};

describe('scriptCarrierRefusal', () => {
  it('words the refusal the way the REST server maps it', () => {
    expect(scriptCarrierRefusal(carrier)).toBe(
      'Script macros are disabled: flags.midi-qol.onUseMacroName makes Midi-QOL run a macro. ' +
        'Enable "Allow Script Macros" in module settings to write it via API.'
    );
  });
});

describe('refuseScriptCarriers', () => {
  it('refuses a carrier without the opt-in, naming the first one', () => {
    const found = [carrier, { ...carrier, path: 'flags.dae.itemMacro', module: 'DAE' as const }];
    let thrown: unknown;
    try {
      refuseScriptCarriers(found, () => false);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(ScriptCarrierRefusedError);
    expect(thrown).toBeInstanceOf(DomainError);
    expect((thrown as ScriptCarrierRefusedError).message).toMatch(/^Script macros are disabled: flags\.midi-qol/);
    expect((thrown as ScriptCarrierRefusedError).carriers).toHaveLength(2);
    expect((thrown as ScriptCarrierRefusedError).name).toBe('ScriptCarrierRefusedError');
  });

  it('lets carriers through with the opt-in', () => {
    expect(() => refuseScriptCarriers(findFlagCarriers('Item', 'itemacro', 'macro.command', 'x'), () => true)).not.toThrow();
  });

  it('does not read the opt-in when nothing is carried', () => {
    const allows = jest.fn(() => false);
    refuseScriptCarriers([], allows);
    expect(allows).not.toHaveBeenCalled();
  });
});

describe('refuseNewScriptCarriers', () => {
  const write = { system: { activities: { a1: { macroData: { command: 'return 1' } } } } };

  it('refuses a new carrier without the opt-in', () => {
    expect(() => refuseNewScriptCarriers('Item', write, () => false)).toThrow(
      'Script macros are disabled: system.activities.a1.macroData.command makes Midi-QOL run a macro.'
    );
  });

  it('lets a carrier the document already holds with the same value through', () => {
    expect(() => refuseNewScriptCarriers('Item', write, () => false, () => write)).not.toThrow();
    expect(() =>
      refuseNewScriptCarriers('Item', write, () => false, () => ({ system: { activities: { a1: { macroData: { command: 'x' } } } } }))
    ).toThrow(ScriptCarrierRefusedError);
  });

  it('reads neither the stored document nor the opt-in for an ordinary write', () => {
    const readStored = jest.fn();
    const allows = jest.fn(() => false);
    refuseNewScriptCarriers('Item', { name: 'Sword', system: { damage: '1d8' } }, allows, readStored);
    expect(readStored).not.toHaveBeenCalled();
    expect(allows).not.toHaveBeenCalled();
  });
});

describe('splitOverTimeSpec', () => {
  it('splits fields at "," or "#" before a key and keeps commas inside values', () => {
    expect(
      splitOverTimeSpec('turn=end, damageRoll=max(1, 2)d6, label="A, B" # saveDC = 13, applyCondition=a == b')
    ).toEqual({ turn: 'end', damageRoll: 'max(1, 2)d6', label: '"A, B"', saveDC: '13', applyCondition: 'a == b' });
  });

  it('stops at text that is not a field', () => {
    expect(splitOverTimeSpec('  ,turn=start')).toEqual({ turn: 'start' });
    expect(splitOverTimeSpec('just text')).toEqual({});
    expect(splitOverTimeSpec('')).toEqual({});
  });
});
