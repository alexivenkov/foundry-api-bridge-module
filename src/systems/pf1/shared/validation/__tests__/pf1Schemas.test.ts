import { formatZodError } from '@/systems/shared/validation';
import {
  rollAbilityRequestSchema,
  rollSaveRequestSchema,
  rollSpellbookCheckRequestSchema,
  RequestToCommandMapper as CheckMapper
} from '@/systems/pf1/checks';
import { useItemRequestSchema, RequestToCommandMapper as ItemUseMapper } from '@/systems/pf1/item-use';
import {
  applyDamageRequestSchema,
  EXACTLY_ONE_OF_DAMAGE_OR_HEAL,
  REDUCTION_ONLY_FOR_DAMAGE,
  RequestToCommandMapper as DamageMapper
} from '@/systems/pf1/damage';
import { setConditionRequestSchema } from '@/systems/pf1/conditions';
import { getSummaryRequestSchema } from '@/systems/pf1/summary';

function errorOf(result: { success: boolean; error?: unknown }): string {
  return result.success ? '' : formatZodError(result.error as Parameters<typeof formatZodError>[0]);
}

describe('pf1 request schemas', () => {
  it('require an actor or a token everywhere', () => {
    for (const schema of [getSummaryRequestSchema, setConditionRequestSchema, rollSpellbookCheckRequestSchema]) {
      expect(errorOf(schema.safeParse({ condition: 'prone', active: true }))).toContain('Either actorId or tokenId is required');
    }
  });

  it('restrict abilities, saves, Take X and roll modes to the system values', () => {
    expect(rollAbilityRequestSchema.safeParse({ actorId: 'a', ability: 'str' }).success).toBe(true);
    expect(errorOf(rollAbilityRequestSchema.safeParse({ actorId: 'a', ability: 'luck' }))).toMatch(/^ability: /);
    expect(rollSaveRequestSchema.safeParse({ actorId: 'a', save: 'fortitude' }).success).toBe(false);
    expect(rollSaveRequestSchema.safeParse({ actorId: 'a', save: 'fort', takeX: 15 }).success).toBe(false);
    expect(rollSaveRequestSchema.safeParse({ actorId: 'a', save: 'fort', rollMode: 'roll' }).success).toBe(false);
  });

  it('map check options with defaults and a numeric bonus as a formula', () => {
    expect(CheckMapper.toRollSpellbookCheckCommand({ tokenId: 't', bonus: 2, takeX: 20 })).toEqual({
      target: { actorId: undefined, tokenId: 't', sceneId: undefined },
      spellbook: 'primary',
      options: { bonus: '2', dc: undefined, takeX: 20, rollMode: undefined, showInChat: false }
    });
  });

  it('map only the use toggles the caller set', () => {
    const parsed = useItemRequestSchema.parse({ actorId: 'a', item: 'Longbow', pointBlankShot: true, flanking: false, showInChat: true });
    expect(ItemUseMapper.toUseItemCommand(parsed)).toEqual({
      target: { actorId: 'a', tokenId: undefined, sceneId: undefined },
      item: 'Longbow',
      options: { actionId: undefined, cost: undefined, rollMode: undefined, showInChat: true, toggles: { pointBlankShot: true, flanking: false } }
    });
  });

  it('take exactly one of damage and heal, and keep ratio / reduction for damage', () => {
    expect(errorOf(applyDamageRequestSchema.safeParse({ actorId: 'a' }))).toContain(EXACTLY_ONE_OF_DAMAGE_OR_HEAL);
    expect(errorOf(applyDamageRequestSchema.safeParse({ actorId: 'a', damage: 3, heal: 2 }))).toContain(EXACTLY_ONE_OF_DAMAGE_OR_HEAL);
    expect(errorOf(applyDamageRequestSchema.safeParse({ actorId: 'a', heal: 3, ratio: 0.5 }))).toContain(REDUCTION_ONLY_FOR_DAMAGE);
    expect(applyDamageRequestSchema.safeParse({ actorId: 'a', damage: 0 }).success).toBe(false);
    expect(applyDamageRequestSchema.safeParse({ actorId: 'a', damage: 2.5 }).success).toBe(false);

    expect(DamageMapper.toApplyDamageCommand({ actorId: 'a', heal: 4 }).options.value).toBe(-4);
    expect(DamageMapper.toApplyDamageCommand({ actorId: 'a', damage: 9, reduction: 5 }).options).toEqual({
      value: 9,
      nonlethal: false,
      asWounds: false,
      reduction: 5,
      ratio: undefined
    });
  });
});
