import { toActorTarget, toCheckOptions } from '@/systems/pf1/shared/validation';
import type {
  RollAbilityCommand,
  RollSaveCommand,
  RollSkillCommand,
  RollSpellbookCheckCommand
} from '@/systems/pf1/checks/application';
import type {
  RollAbilityRequest,
  RollSaveRequest,
  RollSkillRequest,
  RollSpellbookCheckRequest
} from './CheckRequestSchemas';

/** Single-class casters keep their spells in the first book. */
const DEFAULT_SPELLBOOK = 'primary';

export const RequestToCommandMapper = {
  toRollAbilityCommand(request: RollAbilityRequest): RollAbilityCommand {
    return { target: toActorTarget(request), ability: request.ability, options: toCheckOptions(request) };
  },
  toRollSkillCommand(request: RollSkillRequest): RollSkillCommand {
    return { target: toActorTarget(request), skill: request.skill, options: toCheckOptions(request) };
  },
  toRollSaveCommand(request: RollSaveRequest): RollSaveCommand {
    return { target: toActorTarget(request), save: request.save, options: toCheckOptions(request) };
  },
  toRollSpellbookCheckCommand(request: RollSpellbookCheckRequest): RollSpellbookCheckCommand {
    return {
      target: toActorTarget(request),
      spellbook: request.spellbook ?? DEFAULT_SPELLBOOK,
      options: toCheckOptions(request)
    };
  }
};
