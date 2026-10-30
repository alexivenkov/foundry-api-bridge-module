import type {
  Coc7ActorSummary,
  Coc7ApplyDamageResult,
  Coc7AttackRollResult,
  Coc7BoutOfMadnessResult,
  Coc7CheckResult,
  Coc7DamageRollResult,
  Coc7LuckResult,
  Coc7SanityCheckResult,
  Coc7SetConditionResult,
  Coc7WeaponSummary
} from '@/commands/types';
import type { Coc7CheckOutcome, Coc7DieRollOutcome } from '@/systems/coc7/shared/domain';
import type { Coc7AttackRollOutcome, Coc7DamageRollOutcome } from '@/systems/coc7/attacks';
import type { Coc7ApplyDamageOutcome } from '@/systems/coc7/damage';
import type { Coc7BoutOfMadnessOutcome, Coc7SanityCheckOutcome } from '@/systems/coc7/sanity';
import type { Coc7LuckOutcome } from '@/systems/coc7/luck';
import type { Coc7SetConditionOutcome } from '@/systems/coc7/conditions';
import type { Coc7ActorSummaryOutcome, Coc7WeaponSummary as Coc7WeaponSummaryOutcome } from '@/systems/coc7/summary';

export function toCoc7CheckResult(outcome: Coc7CheckOutcome): Coc7CheckResult {
  const result: Coc7CheckResult = {
    actorId: outcome.actorId,
    kind: outcome.kind,
    name: outcome.name,
    threshold: outcome.threshold,
    difficulty: outcome.difficulty,
    thresholds: { ...outcome.thresholds },
    dice: {
      tens: outcome.dice.tens.map((die) => ({ value: die.value, kept: die.kept })),
      unit: outcome.dice.unit,
      bonusDice: outcome.dice.bonusDice,
      penaltyDice: outcome.dice.penaltyDice
    },
    total: outcome.total,
    successLevel: outcome.successLevel,
    outcome: outcome.outcome,
    isSuccess: outcome.isSuccess,
    isCritical: outcome.isCritical,
    isFumble: outcome.isFumble,
    luckRequired: { ...outcome.luckRequired },
    canPush: outcome.canPush,
    markedForDevelopment: outcome.markedForDevelopment
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  if (outcome.messageId !== undefined) {
    result.messageId = outcome.messageId;
  }
  return result;
}

export function toCoc7AttackRollResult(outcome: Coc7AttackRollOutcome): Coc7AttackRollResult {
  const result: Coc7AttackRollResult = {
    ...toCoc7CheckResult(outcome),
    weapon: {
      id: outcome.weapon.id,
      name: outcome.weapon.name,
      skill: { ...outcome.weapon.skill },
      ranged: outcome.weapon.ranged,
      impaling: outcome.weapon.impaling,
      damage: { ...outcome.weapon.damage }
    },
    isMalfunction: outcome.isMalfunction,
    impale: outcome.impale
  };
  if (outcome.weapon.malfunction !== undefined) {
    result.weapon.malfunction = outcome.weapon.malfunction;
  }
  return result;
}

function toDice(dice: readonly Coc7DieRollOutcome[]): Coc7DamageRollResult['dice'] {
  return dice.map((die) => ({ formula: die.formula, results: [...die.results], total: die.total }));
}

export function toCoc7DamageRollResult(outcome: Coc7DamageRollOutcome): Coc7DamageRollResult {
  const result: Coc7DamageRollResult = {
    actorId: outcome.actorId,
    weapon: { ...outcome.weapon },
    range: outcome.range,
    formula: outcome.formula,
    damageBonus: outcome.damageBonus,
    impale: outcome.impale,
    maximized: outcome.maximized,
    dice: toDice(outcome.dice),
    total: outcome.total
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  if (outcome.versusTarget !== undefined) {
    const target: Coc7DamageRollResult['versusTarget'] = {
      tokenId: outcome.versusTarget.tokenId,
      name: outcome.versusTarget.name,
      armor: outcome.versusTarget.armor,
      wouldInflict: outcome.versusTarget.wouldInflict
    };
    if (outcome.versusTarget.armorFormula !== undefined) {
      target.armorFormula = outcome.versusTarget.armorFormula;
    }
    result.versusTarget = target;
  }
  if (outcome.messageId !== undefined) {
    result.messageId = outcome.messageId;
  }
  return result;
}

export function toCoc7ApplyDamageResult(outcome: Coc7ApplyDamageOutcome): Coc7ApplyDamageResult {
  const result: Coc7ApplyDamageResult = {
    actorId: outcome.actorId,
    applied: outcome.applied,
    armorAbsorbed: outcome.armorAbsorbed,
    healed: outcome.healed,
    hpBefore: outcome.hpBefore,
    hpAfter: outcome.hpAfter,
    hpMax: outcome.hpMax,
    majorWound: outcome.majorWound,
    unconscious: outcome.unconscious,
    dying: outcome.dying,
    dead: outcome.dead,
    conditions: { ...outcome.conditions }
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  return result;
}

export function toCoc7SanityCheckResult(outcome: Coc7SanityCheckOutcome): Coc7SanityCheckResult {
  const result: Coc7SanityCheckResult = {
    actorId: outcome.actorId,
    roll: toCoc7CheckResult(outcome.roll),
    immune: outcome.immune,
    lossFormula: outcome.lossFormula,
    lossRolled: outcome.lossRolled,
    lossApplied: outcome.lossApplied,
    limitedByReason: outcome.limitedByReason,
    mythosHardened: outcome.mythosHardened,
    applied: outcome.applied,
    sanBefore: outcome.sanBefore,
    sanAfter: outcome.sanAfter,
    sanMax: outcome.sanMax,
    dailyLoss: outcome.dailyLoss,
    dailyLimit: outcome.dailyLimit,
    temporaryInsanity: outcome.temporaryInsanity,
    indefiniteInsanity: outcome.indefiniteInsanity,
    permanentInsanity: outcome.permanentInsanity,
    luckOfferSkipped: outcome.luckOfferSkipped
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  if (outcome.messageId !== undefined) {
    result.messageId = outcome.messageId;
  }
  return result;
}

export function toCoc7BoutOfMadnessResult(outcome: Coc7BoutOfMadnessOutcome): Coc7BoutOfMadnessResult {
  const result: Coc7BoutOfMadnessResult = {
    actorId: outcome.actorId,
    name: outcome.name,
    description: outcome.description,
    phobia: outcome.phobia,
    mania: outcome.mania,
    realTime: outcome.realTime,
    duration: outcome.duration,
    tempoInsane: outcome.tempoInsane
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  return result;
}

export function toCoc7LuckResult(outcome: Coc7LuckOutcome): Coc7LuckResult {
  const result: Coc7LuckResult = {
    actorId: outcome.actorId,
    action: outcome.action,
    before: outcome.before,
    after: outcome.after
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  return result;
}

export function toCoc7SetConditionResult(outcome: Coc7SetConditionOutcome): Coc7SetConditionResult {
  const result: Coc7SetConditionResult = {
    actorId: outcome.actorId,
    conditions: { ...outcome.conditions },
    statuses: outcome.statuses.map((status) => ({ ...status }))
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  return result;
}

function toWeaponSummary(weapon: Coc7WeaponSummaryOutcome): Coc7WeaponSummary {
  const result: Coc7WeaponSummary = {
    id: weapon.id,
    name: weapon.name,
    ranged: weapon.ranged,
    damage: { ...weapon.damage },
    range: { ...weapon.range },
    usesPerRound: weapon.usesPerRound,
    impaling: weapon.impaling,
    properties: [...weapon.properties]
  };
  if (weapon.skill !== undefined) {
    result.skill = { ...weapon.skill };
  }
  if (weapon.alternativeSkill !== undefined) {
    result.alternativeSkill = { ...weapon.alternativeSkill };
  }
  if (weapon.bullets !== undefined) {
    result.bullets = weapon.bullets;
  }
  if (weapon.ammo !== undefined) {
    result.ammo = weapon.ammo;
  }
  if (weapon.malfunction !== undefined) {
    result.malfunction = weapon.malfunction;
  }
  return result;
}

export function toCoc7ActorSummary(outcome: Coc7ActorSummaryOutcome): Coc7ActorSummary {
  const result: Coc7ActorSummary = {
    id: outcome.id,
    name: outcome.name,
    type: outcome.type,
    characteristics: outcome.characteristics.map((characteristic) => ({ ...characteristic })),
    conditions: { ...outcome.conditions },
    statuses: outcome.statuses.map((status) => ({ ...status })),
    skills: outcome.skills.map((skill) => ({ ...skill })),
    weapons: outcome.weapons.map(toWeaponSummary),
    spells: outcome.spells.map((spell) => ({ id: spell.id, name: spell.name, costs: { ...spell.costs } })),
    infos: { ...outcome.infos }
  };
  if (outcome.attributes !== undefined) {
    result.attributes = {
      hp: { ...outcome.attributes.hp },
      mp: { ...outcome.attributes.mp },
      sanity: { ...outcome.attributes.sanity },
      luck: outcome.attributes.luck,
      mov: outcome.attributes.mov,
      db: outcome.attributes.db,
      build: outcome.attributes.build,
      armor: outcome.attributes.armor
    };
  }
  if (outcome.creditRating !== undefined) {
    result.creditRating = outcome.creditRating;
  }
  if (outcome.creature !== undefined) {
    result.creature = { sanLoss: { ...outcome.creature.sanLoss }, attacksPerRound: outcome.creature.attacksPerRound };
  }
  if (outcome.vehicle !== undefined) {
    result.vehicle = { ...outcome.vehicle };
  }
  return result;
}
