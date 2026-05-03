import { makeRangeSchema } from '@/filtering/shared/validation';

// Weight is a non-negative real number in Foundry units (lbs by default).
// Any number >= 0, fractional values allowed (e.g. 0.5 for a healing potion).
export const weightRangeSchema = makeRangeSchema({ minBound: 0 });
