import { z } from 'zod';

export const BOTH_ADVANTAGE_AND_DISADVANTAGE = 'Cannot have both advantage and disadvantage';

export const advantageFlagShape = {
  advantage: z.boolean().optional(),
  disadvantage: z.boolean().optional()
};

interface AdvantageFlags {
  advantage?: boolean | undefined;
  disadvantage?: boolean | undefined;
}

export function notBothAdvantageAndDisadvantage(request: AdvantageFlags): boolean {
  return !(request.advantage === true && request.disadvantage === true);
}

export const advantageFlagsRefinement = {
  message: BOTH_ADVANTAGE_AND_DISADVANTAGE
} as const;
