import { z } from 'zod';
import {
  BONUS_AND_PENALTY_EXCLUSIVE,
  COC7_DIFFICULTIES,
  COC7_MAX_POOL_DICE,
  type Coc7CheckOptions
} from '@/systems/coc7/shared/domain';

export const coc7CheckOptionsShape = {
  difficulty: z.enum(COC7_DIFFICULTIES).optional(),
  bonusDice: z.number().int().min(0).max(COC7_MAX_POOL_DICE).optional(),
  penaltyDice: z.number().int().min(0).max(COC7_MAX_POOL_DICE).optional(),
  flatDiceModifier: z.number().int().optional(),
  flatThresholdModifier: z.number().int().optional(),
  blind: z.boolean().optional(),
  showInChat: z.boolean().optional()
};

export function poolDiceExclusive(request: { bonusDice?: number | undefined; penaltyDice?: number | undefined }): boolean {
  return !((request.bonusDice ?? 0) > 0 && (request.penaltyDice ?? 0) > 0);
}

export const poolDiceRefinement = { message: BONUS_AND_PENALTY_EXCLUSIVE } as const;

export function toCheckOptions(request: {
  difficulty?: Coc7CheckOptions['difficulty'];
  bonusDice?: number | undefined;
  penaltyDice?: number | undefined;
  flatDiceModifier?: number | undefined;
  flatThresholdModifier?: number | undefined;
  blind?: boolean | undefined;
  showInChat?: boolean | undefined;
}): Coc7CheckOptions {
  return {
    difficulty: request.difficulty,
    bonusDice: request.bonusDice ?? 0,
    penaltyDice: request.penaltyDice ?? 0,
    flatDiceModifier: request.flatDiceModifier ?? 0,
    flatThresholdModifier: request.flatThresholdModifier ?? 0,
    blind: request.blind ?? false,
    showInChat: request.showInChat ?? false
  };
}
