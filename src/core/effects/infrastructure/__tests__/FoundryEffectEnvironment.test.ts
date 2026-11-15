import { FoundryEffectEnvironment } from '../FoundryEffectEnvironment';
import type { FoundryEffectGlobals } from '../foundryEffectTypes';

// CONST values as in common/constants.mjs of Foundry 14.368.
const FOUNDRY_14_CONST = {
  ACTIVE_EFFECT_CHANGE_TYPES: { custom: 0, multiply: 10, add: 20, subtract: 20, downgrade: 30, upgrade: 40, override: 50 },
  ACTIVE_EFFECT_CHANGE_PHASES: ['initial', 'final'],
  ACTIVE_EFFECT_EXPIRY_EVENTS: ['combatStart', 'roundStart', 'turnStart', 'combatEnd', 'roundEnd', 'turnEnd']
};

function environment(
  globals: FoundryEffectGlobals,
  generation: number,
  documentTypes?: Record<string, string[]>
): FoundryEffectEnvironment {
  const game = documentTypes === undefined ? {} : { documentTypes };
  return new FoundryEffectEnvironment({ getGame: () => game }, () => globals, () => generation);
}

describe('FoundryEffectEnvironment', () => {
  it('reports the features per generation, reading an unknown generation as the newest', () => {
    expect(environment({}, 13).features()).toEqual({
      subtypes: true,
      durationUnits: false,
      changePhases: false,
      iconVisibility: false
    });
    expect(environment({}, 14).features()).toEqual({
      subtypes: true,
      durationUnits: true,
      changePhases: true,
      iconVisibility: true
    });
    expect(environment({}, 11).features().subtypes).toBe(false);
    expect(environment({}, 0).features()).toMatchObject({ durationUnits: true, iconVisibility: true });
  });

  it('reads the subtypes the world registers', () => {
    expect(environment({}, 14, { ActiveEffect: ['base', 'enchantment'] }).effectTypes()).toEqual(['base', 'enchantment']);
    expect(environment({}, 14).effectTypes()).toBeNull();
  });

  it('compiles the Foundry 14 registries from CONST and what packages register', () => {
    const env = environment(
      {
        CONST: FOUNDRY_14_CONST,
        CONFIG: {
          ActiveEffect: { changeTypes: { 'pf2e.flat': {} }, phases: { early: {} }, expiryEvents: { dawn: 'Dawn' } }
        }
      },
      14
    );

    expect(env.changeTypes()).toEqual(['custom', 'multiply', 'add', 'subtract', 'downgrade', 'upgrade', 'override', 'pf2e.flat']);
    expect(env.changePhases()).toEqual(['initial', 'final', 'early']);
    expect(env.expiryEvents()).toEqual([...FOUNDRY_14_CONST.ACTIVE_EFFECT_EXPIRY_EVENTS, 'dawn']);
  });

  it('knows the six Foundry 13 change modes and no phases or expiry events', () => {
    const env = environment({ CONST: {}, CONFIG: { ActiveEffect: {} } }, 13);

    expect(env.changeTypes()).toEqual(['custom', 'multiply', 'add', 'downgrade', 'upgrade', 'override']);
    expect(env.changePhases()).toBeNull();
    expect(env.expiryEvents()).toBeNull();
  });

  it('cannot read the Foundry 14 registries without CONST', () => {
    expect(environment({}, 14).changeTypes()).toBeNull();
  });

  describe('originProblem', () => {
    function withOriginField(validate: (value: unknown) => { message?: string } | undefined): FoundryEffectEnvironment {
      return environment({ CONFIG: { ActiveEffect: { documentClass: { schema: { fields: { origin: { validate } } } } } } }, 14);
    }

    it('hands back the reason the schema field gives, as DocumentUUIDField does on Foundry 14', () => {
      const env = withOriginField((value) =>
        value === 'Item.abcdefghijklmnop' ? undefined : { message: 'must reference a valid document type' }
      );

      expect(env.originProblem('Item.abcdefghijklmnop')).toBeNull();
      expect(env.originProblem('Bob')).toBe('must reference a valid document type');
    });

    it('falls back to a generic reason, and reads a throwing field as a refusal', () => {
      expect(withOriginField(() => ({})).originProblem('x')).toBe('not a document UUID');
      expect(
        withOriginField(() => {
          throw new Error('cannot be resolved without a document instance');
        }).originProblem('.Item.x')
      ).toBe('cannot be resolved without a document instance');
    });

    it('accepts every origin when the field cannot be read', () => {
      expect(environment({}, 14).originProblem('anything')).toBeNull();
    });
  });
});
