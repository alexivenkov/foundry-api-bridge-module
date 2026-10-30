export const COC7_DIFFICULTIES = ['unknown', 'regular', 'hard', 'extreme', 'critical'] as const;
export type Coc7Difficulty = (typeof COC7_DIFFICULTIES)[number];

/** `CoC7DicePool.difficultyLevel` without `impossible`, which no check uses. */
export const COC7_DIFFICULTY_LEVEL: Readonly<Record<Coc7Difficulty, number>> = {
  unknown: -1,
  regular: 1,
  hard: 2,
  extreme: 3,
  critical: 4
};

export function isCoc7Difficulty(value: unknown): value is Coc7Difficulty {
  return typeof value === 'string' && (COC7_DIFFICULTIES as readonly string[]).includes(value);
}

/** The world's `defaultCheckDifficulty` setting is a string key; anything else means `regular`. */
export function parseCoc7Difficulty(value: unknown, fallback: Coc7Difficulty = 'regular'): Coc7Difficulty {
  return isCoc7Difficulty(value) ? value : fallback;
}
