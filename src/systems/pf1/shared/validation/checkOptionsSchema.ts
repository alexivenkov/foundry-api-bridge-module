import { z } from 'zod';
import { PF1_ROLL_MODES, type Pf1CheckOptions } from '@/systems/pf1/shared/domain';

/** Options every pf1 d20 check accepts. */
export const pf1CheckOptionsShape = {
  bonus: z.union([z.string().min(1), z.number()]).optional(),
  dc: z.number().int().optional(),
  takeX: z.union([z.literal(10), z.literal(20)]).optional(),
  rollMode: z.enum(PF1_ROLL_MODES).optional(),
  showInChat: z.boolean().optional()
};

export function toCheckOptions(request: {
  bonus?: string | number | undefined;
  dc?: number | undefined;
  takeX?: 10 | 20 | undefined;
  rollMode?: string | undefined;
  showInChat?: boolean | undefined;
}): Pf1CheckOptions {
  return {
    bonus: request.bonus === undefined ? undefined : String(request.bonus),
    dc: request.dc,
    takeX: request.takeX,
    rollMode: request.rollMode,
    showInChat: request.showInChat ?? false
  };
}
