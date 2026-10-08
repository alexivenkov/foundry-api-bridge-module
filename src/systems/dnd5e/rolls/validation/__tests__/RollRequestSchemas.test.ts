import {
  rollSkillRequestSchema,
  rollSaveRequestSchema,
  rollAbilityRequestSchema,
  rollPerceptionRequestSchema,
  RequestToCommandMapper,
  BOTH_ADVANTAGE_AND_DISADVANTAGE
} from '../index';
import { formatZodError } from '@/systems/shared/validation';

const schemas = [
  { name: 'roll-skill', schema: rollSkillRequestSchema, base: { actorId: 'a1', skill: 'ste' } },
  { name: 'roll-save', schema: rollSaveRequestSchema, base: { actorId: 'a1', ability: 'dex' } },
  { name: 'roll-ability', schema: rollAbilityRequestSchema, base: { actorId: 'a1', ability: 'str' } },
  { name: 'roll-perception', schema: rollPerceptionRequestSchema, base: { actorId: 'a1' } }
] as const;

describe('dnd5e roll request schemas — advantage / disadvantage', () => {
  describe.each(schemas)('$name', ({ schema, base }) => {
    it('accepts the request without flags', () => {
      expect(schema.safeParse(base).success).toBe(true);
    });

    it('accepts advantage alone and disadvantage alone', () => {
      expect(schema.safeParse({ ...base, advantage: true }).success).toBe(true);
      expect(schema.safeParse({ ...base, disadvantage: true }).success).toBe(true);
      expect(schema.safeParse({ ...base, advantage: true, disadvantage: false }).success).toBe(true);
    });

    it('rejects advantage and disadvantage together with the gateway message', () => {
      const parsed = schema.safeParse({ ...base, advantage: true, disadvantage: true });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(formatZodError(parsed.error)).toBe(BOTH_ADVANTAGE_AND_DISADVANTAGE);
      }
    });

    it('rejects non-boolean flags', () => {
      expect(schema.safeParse({ ...base, advantage: 'yes' }).success).toBe(false);
      expect(schema.safeParse({ ...base, disadvantage: 1 }).success).toBe(false);
    });
  });
});

describe('RequestToCommandMapper — advantage / disadvantage defaults', () => {
  it('defaults missing flags to false on every command', () => {
    expect(RequestToCommandMapper.toRollSkillCommand({ actorId: 'a1', skill: 'ste' })).toEqual({
      actorId: 'a1', skill: 'ste', advantage: false, disadvantage: false, showInChat: false
    });
    expect(RequestToCommandMapper.toRollSaveCommand({ actorId: 'a1', ability: 'dex' })).toEqual({
      actorId: 'a1', ability: 'dex', advantage: false, disadvantage: false, showInChat: false
    });
    expect(RequestToCommandMapper.toRollAbilityCommand({ actorId: 'a1', ability: 'str' })).toEqual({
      actorId: 'a1', ability: 'str', advantage: false, disadvantage: false, showInChat: false
    });
    expect(RequestToCommandMapper.toRollPerceptionCommand({ actorId: 'a1' })).toEqual({
      actorId: 'a1', advantage: false, disadvantage: false, showInChat: false
    });
  });

  it('carries explicit flags through', () => {
    expect(
      RequestToCommandMapper.toRollSkillCommand({ actorId: 'a1', skill: 'ste', disadvantage: true, showInChat: true })
    ).toEqual({ actorId: 'a1', skill: 'ste', advantage: false, disadvantage: true, showInChat: true });
    expect(
      RequestToCommandMapper.toRollPerceptionCommand({ actorId: 'a1', advantage: true })
    ).toEqual({ actorId: 'a1', advantage: true, disadvantage: false, showInChat: false });
  });
});
