import { resolvePf1Skill, skillIdsOf } from '../skills';
import { activePf1Conditions, pf1ConditionIds, resolvePf1ConditionId } from '../conditions';
import { makeActor, makeRegistry } from '@/systems/pf1/shared/__tests__/pf1TestFixtures';

describe('pf1 skills', () => {
  const actor = makeActor();

  it('lists main skills followed by their sub-skills', () => {
    expect(skillIdsOf(actor)).toEqual(['acr', 'per', 'crf', 'crf.alchemy']);
  });

  it('resolves by id, by name and by the sub-skill full or bare name', () => {
    expect(resolvePf1Skill(actor, 'per')).toEqual({ id: 'per', name: 'Perception' });
    expect(resolvePf1Skill(actor, ' perception ')).toEqual({ id: 'per', name: 'Perception' });
    expect(resolvePf1Skill(actor, 'Craft (Alchemy)')).toEqual({ id: 'crf.alchemy', name: 'Craft (Alchemy)' });
    expect(resolvePf1Skill(actor, 'alchemy').id).toBe('crf.alchemy');
  });

  it('refuses unknown skills and actors without skills', () => {
    expect(() => resolvePf1Skill(actor, 'Basket Weaving')).toThrow('Skill not found: Basket Weaving');
    const trap = makeActor({ name: 'Pit', type: 'trap', system: {} });
    expect(() => resolvePf1Skill(trap, 'per')).toThrow('Actor has no skills: Pit');
  });
});

describe('pf1 conditions', () => {
  const registry = makeRegistry();

  it('resolves registry ids exactly or case-insensitively', () => {
    expect(resolvePf1ConditionId(registry, 'shaken')).toBe('shaken');
    expect(resolvePf1ConditionId(registry, 'FlatFooted')).toBe('flatFooted');
  });

  it('lists the valid ids for an unknown condition', () => {
    expect(() => resolvePf1ConditionId(registry, 'sleepy')).toThrow(
      'Unknown PF1 condition: sleepy. Valid conditions: shaken, frightened, flatFooted, prone, paralyzed'
    );
  });

  it('explains a missing registry', () => {
    expect(() => resolvePf1ConditionId(undefined, 'shaken')).toThrow('pf1.registry.conditions is not available');
    expect(pf1ConditionIds(undefined)).toEqual([]);
  });

  it('answers only registry conditions among the actor statuses', () => {
    const actor = makeActor({ statuses: ['prone', 'invisible-token-status', 'shaken'] });
    expect(activePf1Conditions(actor, registry)).toEqual(['shaken', 'prone']);
  });
});
