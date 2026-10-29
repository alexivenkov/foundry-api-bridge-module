export const SWADE_BENNY_ACTIONS = ['spend', 'give', 'refresh'] as const;

export type SwadeBennyAction = (typeof SWADE_BENNY_ACTIONS)[number];
