/** The 32 status effect ids swade 6.0.4 registers in `CONFIG.statusEffects` (`statusEffects.ts`). */
export const SWADE_STATUS_IDS = [
  'shaken', 'incapacitated', 'dead', 'aiming', 'berserk', 'wild-attack', 'defending', 'holding',
  'bound', 'entangled', 'frightened', 'distracted', 'encumbered', 'prone', 'stunned', 'vulnerable',
  'bleeding-out', 'diseased', 'heart-attack', 'on-fire', 'poisoned', 'cover-shield', 'cover', 'reach',
  'torch', 'burrowing', 'flying', 'invisible', 'blind', 'cold-bodied', 'smite', 'protection'
] as const;

export type SwadeStatusId = (typeof SWADE_STATUS_IDS)[number];
