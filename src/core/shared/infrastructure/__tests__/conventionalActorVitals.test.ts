import { readConventionalVitals } from '../conventionalActorVitals';

describe('readConventionalVitals', () => {
  it('reads hp and ac from system.attributes', () => {
    const actor = { system: { attributes: { hp: { value: 25, max: 30 }, ac: { value: 15 } } } };

    expect(readConventionalVitals(actor)).toEqual({ hp: { value: 25, max: 30 }, ac: 15 });
  });

  it.each([
    ['no actor', null],
    ['an actor without system data', {}],
    ['a system with another layout', { system: {} }],
    ['empty attributes', { system: { attributes: {} } }]
  ])('reports nothing for %s', (_case, actor) => {
    expect(readConventionalVitals(actor)).toEqual({ hp: null, ac: null });
  });

  it('reports only the part that is there and numeric', () => {
    expect(readConventionalVitals({ system: { attributes: { hp: { value: 5, max: 9 } } } })).toEqual({
      hp: { value: 5, max: 9 },
      ac: null
    });
    expect(readConventionalVitals({ system: { attributes: { hp: { value: '5' }, ac: { value: 12 } } } })).toEqual({
      hp: null,
      ac: 12
    });
    expect(readConventionalVitals({ system: { attributes: { hp: null, ac: null } } })).toEqual({ hp: null, ac: null });
  });
});
