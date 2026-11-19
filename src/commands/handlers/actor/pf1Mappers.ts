import type {
  Pf1ActorSummary,
  Pf1ApplyDamageResult,
  Pf1AttackResult,
  Pf1CheckResult,
  Pf1D20RollResult,
  Pf1DamageRollResult,
  Pf1HealthStateWire,
  Pf1RollResult,
  Pf1SetConditionResult,
  Pf1UseItemResult
} from '@/commands/types';
import type { Pf1D20RollOutcome, Pf1RollOutcome } from '@/systems/pf1/shared/domain';
import type { Pf1CheckOutcome } from '@/systems/pf1/checks';
import type { Pf1AttackOutcome, Pf1DamageRollOutcome, Pf1UseItemOutcome } from '@/systems/pf1/item-use';
import type { Pf1ApplyDamageOutcome, Pf1HealthState } from '@/systems/pf1/damage';
import type { Pf1SetConditionOutcome } from '@/systems/pf1/conditions';
import type { Pf1ActorSummary as Pf1ActorSummaryOutcome } from '@/systems/pf1/summary';

function toRoll(outcome: Pf1RollOutcome): Pf1RollResult {
  return {
    total: outcome.total,
    formula: outcome.formula,
    dice: outcome.dice.map((die) => ({ type: die.type, count: die.count, results: [...die.results] }))
  };
}

function toD20Roll(outcome: Pf1D20RollOutcome): Pf1D20RollResult {
  return { ...toRoll(outcome), natural: outcome.natural, isStatic: outcome.isStatic };
}

export function toPf1CheckResult(outcome: Pf1CheckOutcome): Pf1CheckResult {
  const result: Pf1CheckResult = {
    actorId: outcome.actorId,
    kind: outcome.kind,
    id: outcome.id,
    name: outcome.name,
    ...toD20Roll(outcome),
    isNat20: outcome.isNat20,
    isNat1: outcome.isNat1
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  if (outcome.dc !== undefined) {
    result.dc = outcome.dc;
  }
  if (outcome.isSuccess !== undefined) {
    result.isSuccess = outcome.isSuccess;
  }
  if (outcome.messageId !== undefined) {
    result.messageId = outcome.messageId;
  }
  return result;
}

function toDamageRoll(outcome: Pf1DamageRollOutcome): Pf1DamageRollResult {
  return { ...toRoll(outcome), types: [...outcome.types] };
}

function toAttack(outcome: Pf1AttackOutcome): Pf1AttackResult {
  const result: Pf1AttackResult = {
    label: outcome.label,
    damage: outcome.damage.map(toDamageRoll),
    damageTotal: outcome.damageTotal,
    critDamage: outcome.critDamage.map(toDamageRoll),
    nonlethal: outcome.nonlethal
  };
  if (outcome.attack !== undefined) {
    result.attack = { ...toD20Roll(outcome.attack), isThreat: outcome.attack.isThreat, isNat1: outcome.attack.isNat1 };
  }
  if (outcome.critConfirm !== undefined) {
    result.critConfirm = toD20Roll(outcome.critConfirm);
  }
  if (outcome.critDamageTotal !== undefined) {
    result.critDamageTotal = outcome.critDamageTotal;
  }
  return result;
}

export function toPf1UseItemResult(outcome: Pf1UseItemOutcome): Pf1UseItemResult {
  const result: Pf1UseItemResult = {
    actorId: outcome.actorId,
    item: { ...outcome.item },
    attacks: outcome.attacks.map(toAttack)
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  if (outcome.action !== undefined) {
    result.action = { ...outcome.action };
  }
  if (outcome.save !== undefined) {
    result.save = { ...outcome.save };
  }
  if (outcome.messageId !== undefined) {
    result.messageId = outcome.messageId;
  }
  return result;
}

function toHealth(state: Pf1HealthState): Pf1HealthStateWire {
  const result: Pf1HealthStateWire = { hp: { ...state.hp } };
  if (state.vigor !== undefined) {
    result.vigor = { ...state.vigor };
  }
  if (state.wounds !== undefined) {
    result.wounds = { ...state.wounds };
  }
  return result;
}

export function toPf1ApplyDamageResult(outcome: Pf1ApplyDamageOutcome): Pf1ApplyDamageResult {
  return {
    actorId: outcome.actorId,
    ...(outcome.tokenId !== undefined ? { tokenId: outcome.tokenId } : {}),
    applied: outcome.applied,
    before: toHealth(outcome.before),
    after: toHealth(outcome.after)
  };
}

export function toPf1SetConditionResult(outcome: Pf1SetConditionOutcome): Pf1SetConditionResult {
  return {
    actorId: outcome.actorId,
    ...(outcome.tokenId !== undefined ? { tokenId: outcome.tokenId } : {}),
    condition: outcome.condition,
    active: outcome.active,
    changed: outcome.changed,
    conditions: [...outcome.conditions]
  };
}

export function toPf1ActorSummary(outcome: Pf1ActorSummaryOutcome): Pf1ActorSummary {
  const result: Pf1ActorSummary = {
    actorId: outcome.actorId,
    name: outcome.name,
    type: outcome.type,
    level: outcome.level,
    cr: outcome.cr,
    alignment: outcome.alignment,
    abilities: Object.fromEntries(Object.entries(outcome.abilities).map(([key, value]) => [key, { ...value }])),
    health: outcome.health === null ? null : toHealth(outcome.health),
    ac: { ...outcome.ac },
    cmb: outcome.cmb,
    cmd: outcome.cmd,
    cmdFlatFooted: outcome.cmdFlatFooted,
    bab: outcome.bab,
    initiative: outcome.initiative,
    sr: outcome.sr,
    saves: { ...outcome.saves },
    speed: { ...outcome.speed },
    conditions: [...outcome.conditions],
    classes: outcome.classes.map((item) => ({ ...item })),
    skills: outcome.skills.map((skill) => ({ ...skill })),
    spellbooks: outcome.spellbooks.map((book) => ({ ...book })),
    spells: outcome.spells.map((spell) => ({ ...spell })),
    usableItems: outcome.usableItems.map((item) => ({
      ...item,
      actions: item.actions.map((action) => ({ ...action }))
    })),
    activeBuffs: outcome.activeBuffs.map((buff) => ({ ...buff }))
  };
  if (outcome.tokenId !== undefined) {
    result.tokenId = outcome.tokenId;
  }
  return result;
}
