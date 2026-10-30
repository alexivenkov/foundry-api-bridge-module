import { ValidationError } from '@/systems/shared/domain/errors';
import { weaponDamageFormula, type Coc7ActorTarget, type Coc7CheckOutcome } from '@/systems/coc7/shared/domain';
import {
  FoundryCoc7DiceRoller,
  checkCardLines,
  isPlainNumber,
  postCoc7Card,
  requireCoc7Weapon,
  resolveCoc7Actor,
  resolveCoc7TargetToken,
  rollCoc7Check,
  skillRefOf,
  speakerFor,
  weaponBonusTerm,
  weaponDamageFormulas,
  type Coc7DiceRoller,
  type Coc7FormulaRoll,
  type FoundryCoc7Actor,
  type FoundryCoc7Game,
  type FoundryCoc7Item
} from '@/systems/coc7/shared/infrastructure';
import type {
  Coc7AttackPort,
  Coc7AttackRollOutcome,
  Coc7DamageRollOutcome,
  Coc7DamageTargetOutcome,
  RollAttackOptions,
  RollDamageOptions
} from '@/systems/coc7/attacks/domain';

const EXTREME_SUCCESS_LEVEL = 3;

function weaponProperty(weapon: FoundryCoc7Item, key: string): boolean {
  return weapon.system.properties?.[key] === true;
}

function malfunctionOf(weapon: FoundryCoc7Item): number | undefined {
  const malfunction = weapon.system.malfunction;
  return typeof malfunction === 'number' && malfunction > 0 ? malfunction : undefined;
}

function armorOf(actor: FoundryCoc7Actor): string | number {
  const attribs = actor.system.attribs;
  if (attribs !== undefined) {
    return attribs.armor.value ?? '0';
  }
  return actor.system.stats?.armor.value ?? '0';
}

/**
 * Anti-corruption layer over CoC7 attacks (CoC7 8.16). `actor.weaponCheck`
 * only opens the combat cards, so the attack is the module's d100 check
 * against the weapon's skill (`item.system.skillMain` / `skillAlternative`,
 * `malfunction` as `CoC7Check#setThreshold` reads them). Damage follows
 * `CoC7ChatDamage#damageFormula`: weapon damage plus the full or half damage
 * bonus; an extreme success maximizes it, and an impaling weapon adds a
 * normal damage roll on top (the system leaves the bonus out of that roll).
 */
export class Coc7AttackGateway implements Coc7AttackPort {
  constructor(
    private readonly game: FoundryCoc7Game,
    private readonly dice: Coc7DiceRoller = new FoundryCoc7DiceRoller()
  ) {}

  async rollAttack(target: Coc7ActorTarget, { itemId, alternativeSkill, options }: RollAttackOptions): Promise<Coc7AttackRollOutcome> {
    const { actor, token, tokenId } = resolveCoc7Actor(this.game, target);
    const weapon = requireCoc7Weapon(actor, itemId);
    const skill = alternativeSkill ? weapon.system.skillAlternative : weapon.system.skillMain;
    const skillRef = skillRefOf(skill);
    if (skill === undefined || skillRef === undefined) {
      throw new ValidationError(`Weapon has no skill: ${weapon.name}`);
    }
    const { resolution, rolls } = await rollCoc7Check(this.game, this.dice, skillRef.value, options);
    const malfunction = malfunctionOf(weapon);
    const isMalfunction = malfunction !== undefined && resolution.total >= malfunction;
    const impaling = weaponProperty(weapon, 'impl');
    const impale = resolution.successLevel >= EXTREME_SUCCESS_LEVEL && impaling;

    const check: Coc7CheckOutcome = {
      ...resolution,
      actorId: actor.id,
      ...(tokenId !== undefined ? { tokenId } : {}),
      kind: 'weapon',
      name: skill.name,
      canPush: false,
      markedForDevelopment: false
    };
    const outcome: Coc7AttackRollOutcome = {
      ...check,
      weapon: {
        id: weapon.id,
        name: weapon.name,
        skill: skillRef,
        ranged: weaponProperty(weapon, 'rngd'),
        ...(malfunction !== undefined ? { malfunction } : {}),
        impaling,
        damage: weaponDamageFormulas(actor, weapon)
      },
      isMalfunction,
      impale
    };
    if (!options.showInChat) {
      return outcome;
    }
    const lines = checkCardLines(skill.name, resolution);
    if (isMalfunction) {
      lines.push(`Malfunction (${String(malfunction)}+)`);
    }
    if (impale) {
      lines.push('Impale');
    }
    const messageId = await postCoc7Card(this.game, {
      actor,
      token,
      title: `Attack: ${weapon.name}`,
      lines,
      rolls,
      blind: options.blind
    });
    return messageId !== undefined ? { ...outcome, messageId } : outcome;
  }

  async rollDamage(target: Coc7ActorTarget, options: RollDamageOptions): Promise<Coc7DamageRollOutcome> {
    const { actor, token, tokenId } = resolveCoc7Actor(this.game, target);
    const weapon = requireCoc7Weapon(actor, options.itemId);
    const damage = (weapon.system.range?.[options.range].damage ?? '').trim();
    if (damage === '') {
      throw new ValidationError(`Weapon has no damage for range: ${options.range}`);
    }
    const damageBonus = weaponBonusTerm(actor, weapon);
    const base = weaponDamageFormula(damage, damageBonus);
    const maximized = options.successLevel === 'extreme';
    const impale = maximized && weaponProperty(weapon, 'impl');

    let roll: Coc7FormulaRoll;
    if (!maximized) {
      roll = await this.dice.rollFormula(base);
    } else if (impale) {
      const max = (await this.dice.rollFormula(base, {}, { maximize: true })).total;
      roll = await this.dice.rollFormula(`${damage}+${String(max)}`);
    } else {
      roll = await this.dice.rollFormula(base, {}, { maximize: true });
    }

    const versusTarget = options.targetTokenId !== undefined ? await this.preview(options.targetTokenId, target.sceneId, roll.total) : undefined;
    const outcome: Coc7DamageRollOutcome = {
      actorId: actor.id,
      ...(tokenId !== undefined ? { tokenId } : {}),
      weapon: { id: weapon.id, name: weapon.name },
      range: options.range,
      formula: roll.formula,
      damageBonus,
      impale,
      maximized,
      dice: roll.dice,
      total: roll.total,
      ...(versusTarget !== undefined ? { versusTarget } : {})
    };
    if (!options.showInChat) {
      return outcome;
    }
    const messageData: Record<string, unknown> = { flavor: `${weapon.name} damage (${options.range})` };
    const speaker = speakerFor(actor, token);
    if (speaker) {
      messageData['speaker'] = speaker;
    }
    const message = await roll.roll.toMessage(messageData);
    const messageId = message?.id;
    return typeof messageId === 'string' ? { ...outcome, messageId } : outcome;
  }

  private async preview(targetTokenId: string, sceneId: string | undefined, total: number): Promise<Coc7DamageTargetOutcome> {
    const targetToken = resolveCoc7TargetToken(this.game, targetTokenId, sceneId);
    const armorValue = armorOf(targetToken.actor);
    let armor: number;
    let armorFormula: string | undefined;
    if (typeof armorValue === 'number') {
      armor = armorValue;
    } else if (isPlainNumber(armorValue)) {
      armor = Number(armorValue.trim());
    } else {
      armorFormula = armorValue;
      armor = (await this.dice.rollFormula(armorValue, targetToken.actor.parsedValues())).total;
    }
    return {
      tokenId: targetToken.tokenId,
      name: targetToken.name,
      armor,
      ...(armorFormula !== undefined ? { armorFormula } : {}),
      wouldInflict: Math.max(0, total - armor)
    };
  }
}
