import type {
  SwadeActorSummary,
  SwadeApplyDamageResult,
  SwadeAttackRollResult,
  SwadeBenniesResult,
  SwadeDamagePreview,
  SwadeDamageRollResult,
  SwadeDieResult,
  SwadeSoakResult,
  SwadeTraitRollResult
} from '@/commands/types';
import type { SwadeDieOutcome, SwadeTraitRollOutcome } from '@/systems/swade/shared/domain';
import type { SwadeAttackRollOutcome, SwadeDamageRollOutcome } from '@/systems/swade/rolls';
import type { SwadeApplyDamageOutcome, SwadeDamagePreview as SwadeDamagePreviewOutcome, SwadeSoakOutcome } from '@/systems/swade/damage';
import type { SwadeBenniesOutcome } from '@/systems/swade/bennies';
import type { SwadeActorSummary as SwadeActorSummaryOutcome } from '@/systems/swade/summary';

function toDice(dice: readonly SwadeDieOutcome[]): SwadeDieResult[] {
  return dice.map((die) => ({
    type: die.type,
    results: [...die.results],
    total: die.total,
    wild: die.wild,
    kept: die.kept
  }));
}

export function toSwadeTraitRollResult(outcome: SwadeTraitRollOutcome): SwadeTraitRollResult {
  const result: SwadeTraitRollResult = {
    actorId: outcome.actorId,
    trait: outcome.trait,
    total: outcome.total,
    formula: outcome.formula,
    dice: toDice(outcome.dice),
    modifiers: outcome.modifiers.map((modifier) => ({ label: modifier.label, value: modifier.value })),
    modifierTotal: outcome.modifierTotal,
    targetNumber: outcome.targetNumber,
    successes: outcome.successes,
    outcome: outcome.outcome,
    raises: outcome.raises,
    isCriticalFailure: outcome.isCriticalFailure,
    wildDie: outcome.wildDie,
    isCritical: outcome.isCritical,
    isFumble: outcome.isFumble
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  if (outcome.messageId !== undefined) {
    result.messageId = outcome.messageId;
  }
  return result;
}

export function toSwadeAttackRollResult(outcome: SwadeAttackRollOutcome): SwadeAttackRollResult {
  const result: SwadeAttackRollResult = {
    ...toSwadeTraitRollResult(outcome),
    weapon: { ...outcome.weapon },
    hit: outcome.hit
  };
  if (outcome.target !== undefined) {
    result.target = { ...outcome.target };
  }
  return result;
}

export function toSwadeDamagePreview(preview: SwadeDamagePreviewOutcome): SwadeDamagePreview {
  return {
    toughness: preview.toughness,
    armor: preview.armor,
    apApplied: preview.apApplied,
    effectiveToughness: preview.effectiveToughness,
    excess: preview.excess,
    outcome: preview.outcome,
    woundsInflicted: preview.woundsInflicted,
    doubleShaken: preview.doubleShaken,
    wouldIncapacitate: preview.wouldIncapacitate
  };
}

export function toSwadeDamageRollResult(outcome: SwadeDamageRollOutcome): SwadeDamageRollResult {
  const result: SwadeDamageRollResult = {
    actorId: outcome.actorId,
    weapon: { ...outcome.weapon },
    total: outcome.total,
    formula: outcome.formula,
    dice: toDice(outcome.dice),
    ap: outcome.ap,
    isHeavyWeapon: outcome.isHeavyWeapon,
    raiseDamageIncluded: outcome.raiseDamageIncluded,
    isCritical: false,
    isFumble: false
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  if (outcome.versusTarget !== undefined) {
    result.versusTarget = toSwadeDamagePreview(outcome.versusTarget);
  }
  if (outcome.messageId !== undefined) {
    result.messageId = outcome.messageId;
  }
  return result;
}

export function toSwadeApplyDamageResult(outcome: SwadeApplyDamageOutcome): SwadeApplyDamageResult {
  const result: SwadeApplyDamageResult = {
    ...toSwadeDamagePreview(outcome),
    actorId: outcome.actorId,
    applied: outcome.applied,
    shakenBefore: outcome.shakenBefore,
    shakenAfter: outcome.shakenAfter,
    woundsBefore: outcome.woundsBefore,
    woundsAfter: outcome.woundsAfter,
    woundsMax: outcome.woundsMax,
    incapacitated: outcome.incapacitated,
    canSoak: outcome.canSoak
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  return result;
}

export function toSwadeSoakResult(outcome: SwadeSoakOutcome): SwadeSoakResult {
  const result: SwadeSoakResult = {
    actorId: outcome.actorId,
    roll: toSwadeTraitRollResult(outcome.roll),
    woundsSoaked: outcome.woundsSoaked,
    woundsRemaining: outcome.woundsRemaining,
    woundsAfter: outcome.woundsAfter,
    bennySpent: outcome.bennySpent,
    benniesLeft: outcome.benniesLeft,
    shakenRemoved: outcome.shakenRemoved
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  return result;
}

export function toSwadeBenniesResult(outcome: SwadeBenniesOutcome): SwadeBenniesResult {
  const result: SwadeBenniesResult = {
    owner: outcome.owner,
    action: outcome.action,
    before: outcome.before,
    after: outcome.after
  };
  if (outcome.actorId !== undefined) {
    result.actorId = outcome.actorId;
  }
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  if (outcome.max !== undefined) {
    result.max = outcome.max;
  }
  return result;
}

export function toSwadeActorSummary(outcome: SwadeActorSummaryOutcome): SwadeActorSummary {
  const result: SwadeActorSummary = {
    actorId: outcome.actorId,
    name: outcome.name,
    type: outcome.type,
    wildcard: outcome.wildcard,
    status: { ...outcome.status, active: [...outcome.status.active] },
    weapons: outcome.weapons.map((weapon) => ({ ...weapon })),
    powers: outcome.powers.map((power) => ({ ...power }))
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  if (outcome.attributes !== undefined) {
    result.attributes = {
      agility: { ...outcome.attributes.agility },
      smarts: { ...outcome.attributes.smarts },
      spirit: { ...outcome.attributes.spirit },
      strength: { ...outcome.attributes.strength },
      vigor: { ...outcome.attributes.vigor }
    };
  }
  if (outcome.skills !== undefined) {
    result.skills = outcome.skills.map((skill) => ({ ...skill }));
  }
  if (outcome.derived !== undefined) {
    result.derived = { ...outcome.derived };
  }
  if (outcome.bennies !== undefined) {
    result.bennies = { ...outcome.bennies };
  }
  if (outcome.wounds !== undefined) {
    result.wounds = { ...outcome.wounds };
  }
  if (outcome.fatigue !== undefined) {
    result.fatigue = { ...outcome.fatigue };
  }
  if (outcome.powerPoints !== undefined) {
    const pools: Record<string, { value: number; max: number }> = {};
    for (const [arcane, pool] of Object.entries(outcome.powerPoints)) {
      pools[arcane] = { ...pool };
    }
    result.powerPoints = pools;
  }
  if (outcome.conviction !== undefined) {
    result.conviction = { ...outcome.conviction };
  }
  if (outcome.rank !== undefined) {
    result.rank = outcome.rank;
  }
  if (outcome.initiative !== undefined) {
    result.initiative = { ...outcome.initiative };
  }
  if (outcome.vehicle !== undefined) {
    result.vehicle = {
      ...outcome.vehicle,
      wounds: { ...outcome.vehicle.wounds },
      topSpeed: { ...outcome.vehicle.topSpeed }
    };
  }
  return result;
}
