import { makeRangeSchema } from '@/kernel/validation';
import { ChallengeRating } from '@/filtering/actors/domain/value-objects';

export const challengeRatingRangeSchema = makeRangeSchema({
  allowedValues: ChallengeRating.VALID_VALUES
});
