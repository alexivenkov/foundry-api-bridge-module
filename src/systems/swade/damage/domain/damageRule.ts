export type SwadeDamageOutcomeKind = 'none' | 'shaken' | 'wounded';

export interface SwadeDamageRuleInput {
  readonly damage: number;
  readonly ap: number;
  readonly toughness: number;
  readonly armor: number;
  readonly alreadyShaken: boolean;
  readonly hardy: boolean;
  readonly woundCap: boolean;
  readonly woundsBefore: number;
  readonly woundsMax: number;
  readonly isVehicle: boolean;
}

export interface SwadeDamagePreview {
  readonly toughness: number;
  readonly armor: number;
  readonly apApplied: number;
  readonly effectiveToughness: number;
  readonly excess: number;
  readonly outcome: SwadeDamageOutcomeKind;
  readonly woundsInflicted: number;
  readonly doubleShaken: boolean;
  readonly wouldIncapacitate: boolean;
}

const WOUND_CAP = 4;
const RAISE = 4;

/**
 * SWADE damage against Toughness, as the system's `DamageApplicator.calcWounds`
 * does it (swade 6.0.4): AP eats armor, every raise over the effective
 * Toughness is a Wound, a hit without a raise Shakes, and a second Shaken
 * becomes a Wound unless the target is Hardy. Vehicles never get Shaken.
 */
export function computeDamage(input: SwadeDamageRuleInput): SwadeDamagePreview {
  const apApplied = Math.min(Math.max(input.ap, 0), Math.max(input.armor, 0));
  const effectiveToughness = input.toughness - apApplied;
  const excess = input.damage - effectiveToughness;

  let woundsInflicted = excess >= 0 ? Math.floor(excess / RAISE) : 0;
  if (input.woundCap && woundsInflicted > WOUND_CAP) {
    woundsInflicted = WOUND_CAP;
  }

  let outcome: SwadeDamageOutcomeKind = 'none';
  let doubleShaken = false;
  if (excess >= 0 && excess < RAISE) {
    outcome = 'shaken';
    if (input.alreadyShaken && !input.isVehicle && !input.hardy) {
      woundsInflicted = 1;
      outcome = 'wounded';
      doubleShaken = true;
    }
  } else if (excess >= RAISE) {
    outcome = 'wounded';
  }
  if (input.isVehicle && outcome === 'shaken') {
    outcome = 'none';
  }

  return {
    toughness: input.toughness,
    armor: input.armor,
    apApplied,
    effectiveToughness,
    excess,
    outcome,
    woundsInflicted,
    doubleShaken,
    wouldIncapacitate: input.woundsBefore + woundsInflicted > input.woundsMax
  };
}
