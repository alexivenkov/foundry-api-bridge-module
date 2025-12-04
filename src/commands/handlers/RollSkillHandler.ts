import type { RollSkillParams, RollResult } from '@/commands/types';
import { extractDiceResults } from '@/commands/handlers/shared';
import type { FoundryD20Roll, RollDialogConfig, RollMessageConfig } from '@/commands/handlers/shared';

/**
 * D&D 5e skill abbreviations
 * @see https://foundryvtt.wiki/en/basics/Macros
 */
export const SKILL_KEYS = [
  'acr', 'ani', 'arc', 'ath', 'dec', 'his', 'ins', 'itm',
  'inv', 'med', 'nat', 'prc', 'prf', 'per', 'rel', 'slt', 'ste', 'sur'
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

interface FoundryActor {
  id: string;
  name: string;
  rollSkill(
    config: { skill: SkillKey },
    dialog?: RollDialogConfig,
    message?: RollMessageConfig
  ): Promise<FoundryD20Roll[]>;
}

interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
}

interface FoundryGame {
  actors: ActorsCollection;
}

declare const game: FoundryGame;

function isValidSkillKey(skill: string): skill is SkillKey {
  return SKILL_KEYS.includes(skill as SkillKey);
}

export async function rollSkillHandler(params: RollSkillParams): Promise<RollResult> {
  const actor = game.actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  if (!isValidSkillKey(params.skill)) {
    throw new Error(`Invalid skill key: ${params.skill}. Valid keys: ${SKILL_KEYS.join(', ')}`);
  }

  const rolls = await actor.rollSkill(
    { skill: params.skill },
    { configure: false },
    { create: params.showInChat ?? false }
  );

  const roll = rolls[0];

  if (!roll) {
    throw new Error('Skill roll returned no results');
  }

  const dice = extractDiceResults(roll.terms);

  const result: RollResult = {
    total: roll.total,
    formula: roll.formula,
    dice
  };

  if (roll.isCritical) {
    result.isCritical = true;
  }

  if (roll.isFumble) {
    result.isFumble = true;
  }

  return result;
}