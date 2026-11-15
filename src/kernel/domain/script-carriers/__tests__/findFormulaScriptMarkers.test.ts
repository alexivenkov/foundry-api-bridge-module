import { findFormulaScriptMarkers } from '../findFormulaScriptMarkers';
import { scriptCarrierRefusal } from '../ScriptCarrierRefusedError';

describe('findFormulaScriptMarkers', () => {
  it('finds the marker in a top-level formula', () => {
    expect(findFormulaScriptMarkers({ formula: '1d20 + dae.eval(1)' })).toEqual([
      { path: 'params.formula', module: 'DAE', runs: 'JavaScript', identity: 'params.formula=1d20 + dae.eval(1)' }
    ]);
  });

  it('finds it in nested objects and arrays, with the path to each string', () => {
    const found = findFormulaScriptMarkers({
      content: 'Roll [[dae.eval(2)]] now',
      results: [{ text: 'plain' }, { text: 'x dae.eval(3)' }],
      deep: { a: { b: 'dae.eval(4)' } }
    });

    expect(found.map((carrier) => carrier.path)).toEqual([
      'params.content',
      'params.results.1.text',
      'params.deep.a.b'
    ]);
  });

  it.each([
    ['ordinary formulas', { formula: '2d6 + @abilities.str.mod' }],
    ['a different case, which DAE does not evaluate', { formula: 'DAE.EVAL(1)' }],
    ['the name without a call', { content: 'dae.eval is a DAE feature' }],
    ['dae.roll, which DAE counts as 0 without evaluating anything', { formula: 'dae.roll(1d4)' }],
    ['non-string values', { count: 3, flag: true, nothing: null }],
    ['params that are not an object', undefined]
  ])('ignores %s', (_case, params) => {
    expect(findFormulaScriptMarkers(params)).toEqual([]);
  });

  it('words the refusal like every other carrier', () => {
    const [carrier] = findFormulaScriptMarkers({ formula: 'dae.eval(1)' });

    expect(carrier && scriptCarrierRefusal(carrier)).toBe(
      'Script macros are disabled: params.formula makes DAE run JavaScript. ' +
        'Enable "Allow Script Macros" in module settings to write it via API.'
    );
  });
});
