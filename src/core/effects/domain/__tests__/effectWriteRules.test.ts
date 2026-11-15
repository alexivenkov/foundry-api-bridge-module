import { CoreFeatureUnavailableError } from '../../../shared';
import {
  InvalidEffectOriginError,
  UnknownEffectRegistryIdError,
  assertEffectWrite,
  uniqueStatuses,
  type EffectChangeSpec,
  type EffectEnvironment,
  type EffectFeatures
} from '..';

const FOUNDRY_14_FEATURES: EffectFeatures = {
  subtypes: true,
  durationUnits: true,
  changePhases: true,
  iconVisibility: true
};

const FOUNDRY_13_FEATURES: EffectFeatures = {
  subtypes: true,
  durationUnits: false,
  changePhases: false,
  iconVisibility: false
};

/** A Foundry 14 world with the core registries and an `enchantment` subtype, unless told otherwise. */
class FakeEffectEnvironment implements EffectEnvironment {
  effectTypeIds: readonly string[] | null = ['base', 'enchantment'];
  changeTypeIds: readonly string[] | null = ['custom', 'multiply', 'add', 'subtract', 'downgrade', 'upgrade', 'override'];
  phaseIds: readonly string[] | null = ['initial', 'final'];
  expiryEventIds: readonly string[] | null = ['combatStart', 'roundStart', 'turnStart', 'combatEnd', 'roundEnd', 'turnEnd'];
  refusedOrigins: Readonly<Record<string, string>> = {};

  constructor(private readonly featureSet: EffectFeatures = FOUNDRY_14_FEATURES) {}

  features(): EffectFeatures {
    return this.featureSet;
  }

  effectTypes(): readonly string[] | null {
    return this.effectTypeIds;
  }

  changeTypes(): readonly string[] | null {
    return this.changeTypeIds;
  }

  changePhases(): readonly string[] | null {
    return this.phaseIds;
  }

  expiryEvents(): readonly string[] | null {
    return this.expiryEventIds;
  }

  originProblem(origin: string): string | null {
    return this.refusedOrigins[origin] ?? null;
  }
}

const add: EffectChangeSpec = { key: 'system.attributes.ac.bonus', type: 'add', value: 2 };

describe('assertEffectWrite', () => {
  it('accepts everything a Foundry 14 world registers', () => {
    const environment = new FakeEffectEnvironment();

    expect(() =>
      assertEffectWrite(
        {
          type: 'enchantment',
          system: { magical: true },
          changes: [add, { ...add, type: 'subtract', phase: 'final' }],
          duration: { value: 8, units: 'hours', expiry: 'turnEnd' },
          showIcon: 'always',
          origin: 'Item.abcdefghijklmnop'
        },
        environment
      )
    ).not.toThrow();
  });

  it('refuses a subtype, change type, phase or expiry event the world does not register, naming the valid ones', () => {
    const environment = new FakeEffectEnvironment();
    environment.effectTypeIds = ['base'];

    expect(() => assertEffectWrite({ type: 'enchantment' }, environment)).toThrow(
      new UnknownEffectRegistryIdError('type', 'enchantment', ['base'])
    );
    expect(() => assertEffectWrite({ type: 'enchantment' }, environment)).toThrow(
      'Unknown effect type: enchantment (valid: base)'
    );
    expect(() => assertEffectWrite({ changes: [{ ...add, type: 'ad' }] }, environment)).toThrow(
      'Unknown effect change type: ad (valid: custom, multiply, add, subtract, downgrade, upgrade, override)'
    );
    expect(() => assertEffectWrite({ changes: [{ ...add, phase: 'middle' }] }, environment)).toThrow(
      'Unknown effect change phase: middle (valid: initial, final)'
    );
    expect(() => assertEffectWrite({ duration: { value: 1, units: 'rounds', expiry: 'dawn' } }, environment)).toThrow(
      /^Unknown effect expiry event: dawn \(valid: combatStart, /
    );
  });

  it('checks nothing against a registry it cannot read', () => {
    const environment = new FakeEffectEnvironment();
    environment.effectTypeIds = null;
    environment.changeTypeIds = null;
    environment.phaseIds = null;
    environment.expiryEventIds = null;

    expect(() =>
      assertEffectWrite(
        { type: 'any', changes: [{ ...add, type: 'any', phase: 'any' }], duration: { value: 1, units: 'turns', expiry: 'any' } },
        environment
      )
    ).not.toThrow();
  });

  it('refuses on Foundry 13 what only Foundry 14 stores', () => {
    const environment = new FakeEffectEnvironment(FOUNDRY_13_FEATURES);
    const refusal = (input: Parameters<typeof assertEffectWrite>[0]): unknown => {
      try {
        assertEffectWrite(input, environment);
        return null;
      } catch (error) {
        return error;
      }
    };

    expect(refusal({ duration: { value: 8, units: 'hours' } })).toEqual(
      new CoreFeatureUnavailableError('Effect durations in hours require Foundry 14 or newer')
    );
    expect(refusal({ duration: { value: 3, units: 'rounds', expiry: 'turnEnd' } })).toEqual(
      new CoreFeatureUnavailableError('Effect expiry events require Foundry 14 or newer')
    );
    expect(refusal({ changes: [{ ...add, phase: 'initial' }] })).toEqual(
      new CoreFeatureUnavailableError('Effect change phases require Foundry 14 or newer')
    );
    expect(refusal({ showIcon: 'never' })).toEqual(
      new CoreFeatureUnavailableError('Effect icon visibility requires Foundry 14 or newer')
    );
    expect(refusal({ duration: { value: 3, units: 'rounds', expiry: null } })).toBeNull();
    expect(refusal({ duration: { value: 60, units: 'seconds' } })).toBeNull();
  });

  it('refuses subtypes and type data where the core has none', () => {
    const environment = new FakeEffectEnvironment({ ...FOUNDRY_13_FEATURES, subtypes: false });

    expect(() => assertEffectWrite({ system: {} }, environment)).toThrow(
      'Effect subtypes and type data require Foundry 12 or newer'
    );
    expect(() => assertEffectWrite({ type: 'base' }, environment)).toThrow(CoreFeatureUnavailableError);
  });

  it('refuses an origin the core would drop, with the core\'s reason, and lets a null origin through', () => {
    const environment = new FakeEffectEnvironment();
    environment.refusedOrigins = { Bob: 'must reference a valid document type' };

    expect(() => assertEffectWrite({ origin: 'Bob' }, environment)).toThrow(
      new InvalidEffectOriginError('Bob', 'must reference a valid document type')
    );
    expect(() => assertEffectWrite({ origin: 'Bob' }, environment)).toThrow(
      'Invalid effect origin: Bob (must reference a valid document type)'
    );
    expect(() => assertEffectWrite({ origin: null }, environment)).not.toThrow();
  });
});

describe('uniqueStatuses', () => {
  it('keeps the first of each status, in order', () => {
    expect(uniqueStatuses(['prone', 'blind', 'prone'])).toEqual(['prone', 'blind']);
  });
});
