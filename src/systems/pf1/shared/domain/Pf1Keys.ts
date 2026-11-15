/** The six ability scores (pf1 11.x `pf1.config.abilities`). */
export const PF1_ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export type Pf1AbilityKey = (typeof PF1_ABILITY_KEYS)[number];

/** The three saving throws (pf1 11.x `pf1.config.savingThrows`). */
export const PF1_SAVE_KEYS = ['fort', 'ref', 'will'] as const;

export type Pf1SaveKey = (typeof PF1_SAVE_KEYS)[number];

/** Foundry core roll modes; the system's own dialog offers the same four. */
export const PF1_ROLL_MODES = ['publicroll', 'gmroll', 'blindroll', 'selfroll'] as const;

export type Pf1RollMode = (typeof PF1_ROLL_MODES)[number];
