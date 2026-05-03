import { makeRangeSchema } from '@/filtering/shared/validation';

// Price is denominated in gp by the time it reaches the snapshot/spec stack;
// caller-side bounds therefore are non-negative real numbers.
export const priceRangeSchema = makeRangeSchema({ minBound: 0 });
