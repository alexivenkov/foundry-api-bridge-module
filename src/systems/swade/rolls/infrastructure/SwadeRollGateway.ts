import { ItemNotFoundError, RollResolutionError, ValidationError } from '@/systems/shared/domain/errors';
import { parseSwadeAttributeKey, type SwadeActorTarget, type SwadeAttributeKey, type SwadeTraitRollOutcome } from '@/systems/swade/shared/domain';
import {
  callerModifier,
  completeTraitRoll,
  extractDamageDice,
  localize,
  resolveSwadeActor,
  resolveSwadeTargetToken,
  ROLL_CANCELLED,
  speakerFor,
  type FoundrySwadeActor,
  type FoundrySwadeGame,
  type FoundrySwadeItem,
  type FoundrySwadeRollModifier,
  type FoundrySwadeRollOptions
} from '@/systems/swade/shared/infrastructure';
import { previewDamage } from '@/systems/swade/damage';
import type { SwadeDamagePreview } from '@/systems/swade/damage/domain';
import type {
  AttackRollOptions,
  DamageRollOptions,
  SkillRollOptions,
  SwadeAttackRollOutcome,
  SwadeAttackTarget,
  SwadeAttackWeapon,
  SwadeDamageRollOutcome,
  SwadeRollPort,
  TraitRollOptions
} from '@/systems/swade/rolls/domain';

const DEFAULT_TARGET_NUMBER = 4;
const UNSKILLED = 'Unskilled';

const ATTRIBUTE_LABELS: Record<SwadeAttributeKey, { key: string; fallback: string }> = {
  agility: { key: 'SWADE.AttrAgi', fallback: 'Agility' },
  smarts: { key: 'SWADE.AttrSma', fallback: 'Smarts' },
  spirit: { key: 'SWADE.AttrSpr', fallback: 'Spirit' },
  strength: { key: 'SWADE.AttrStr', fallback: 'Strength' },
  vigor: { key: 'SWADE.AttrVig', fallback: 'Vigor' }
};

function isSkillRoller(actor: FoundrySwadeActor): boolean {
  return actor.type !== 'vehicle' && actor.type !== 'group';
}

function globalApBonus(actor: FoundrySwadeActor): number {
  const mods = actor.system.stats?.globalMods?.ap ?? [];
  return mods.reduce((sum, mod) => sum + Number(mod.value), 0);
}

/**
 * Anti-corruption layer between the SWADE roll port and the system's roll
 * builders (swade 6.0.4). Rolls are built with `suppressChat: true`, which
 * returns an unevaluated `TraitRoll` / `DamageRoll` instead of opening the
 * RollDialog; the gateway evaluates it and posts the chat card itself.
 */
export class SwadeRollGateway implements SwadeRollPort {
  constructor(private readonly game: FoundrySwadeGame) {}

  async rollAttribute(target: SwadeActorTarget, attribute: string, options: TraitRollOptions): Promise<SwadeTraitRollOutcome> {
    const key = parseSwadeAttributeKey(attribute);
    const { actor, tokenId } = resolveSwadeActor(this.game, target);
    this.requireAttribute(actor, key);

    const roll = await actor.rollAttribute(key, this.traitRollOptions(options));
    const label = localize(this.game, ATTRIBUTE_LABELS[key].key, ATTRIBUTE_LABELS[key].fallback);
    return completeTraitRoll(this.game, roll, {
      actor,
      tokenId,
      trait: key,
      targetNumber: options.targetNumber,
      showInChat: options.showInChat,
      flavor: `${label} ${localize(this.game, 'SWADE.AttributeTest', 'Attribute Test')}`
    });
  }

  async rollSkill(target: SwadeActorTarget, skill: string, options: SkillRollOptions): Promise<SwadeTraitRollOutcome> {
    const { actor, tokenId } = resolveSwadeActor(this.game, target);
    this.requireSkillRoller(actor);

    const skillItem = this.findSkill(actor, skill);
    const rollOptions = this.traitRollOptions(options);
    const skillTest = localize(this.game, 'SWADE.SkillTest', 'Skill Test');

    if (!skillItem) {
      if (!options.unskilled) {
        throw new ValidationError(`Skill not found: ${skill}`);
      }
      const roll = await actor.makeUnskilledAttempt(rollOptions);
      return completeTraitRoll(this.game, roll, {
        actor,
        tokenId,
        trait: UNSKILLED,
        targetNumber: options.targetNumber,
        showInChat: options.showInChat,
        flavor: `${UNSKILLED} ${skillTest}`
      });
    }

    const roll = await actor.rollSkill(skillItem.id, rollOptions);
    return completeTraitRoll(this.game, roll, {
      actor,
      tokenId,
      trait: skillItem.name,
      targetNumber: options.targetNumber,
      showInChat: options.showInChat,
      flavor: `${skillItem.name} ${skillTest}`
    });
  }

  async rollAttack(target: SwadeActorTarget, itemId: string, options: AttackRollOptions): Promise<SwadeAttackRollOutcome> {
    const { actor, tokenId } = resolveSwadeActor(this.game, target);
    this.requireSkillRoller(actor);
    const weapon = this.requireWeapon(actor, itemId);

    const traitName = weapon.system.actions?.trait ?? '';
    const skillItem = traitName.trim() === '' ? undefined : this.findSkill(actor, traitName);
    const isMelee = weapon.system.isMelee === true;

    const targetToken =
      options.targetTokenId !== undefined
        ? resolveSwadeTargetToken(this.game, options.targetTokenId, target.sceneId)
        : undefined;
    const parry = targetToken ? (targetToken.actor.system.stats?.parry?.value ?? 0) : undefined;
    const targetNumber =
      options.targetNumber ?? (targetToken !== undefined && isMelee && parry !== undefined ? parry : DEFAULT_TARGET_NUMBER);

    const additionalMods: FoundrySwadeRollModifier[] = [];
    const traitMod = weapon.system.actions?.traitMod ?? '';
    if (traitMod.trim() !== '') {
      additionalMods.push({ label: 'Trait modifier', value: traitMod });
    }
    const caller = callerModifier(options.modifier, options.modifierLabel);
    if (caller) {
      additionalMods.push(caller);
    }

    const rollOptions: FoundrySwadeRollOptions = {
      suppressChat: true,
      isRerollable: false,
      item: weapon,
      additionalMods
    };
    const roll = skillItem ? await actor.rollSkill(skillItem.id, rollOptions) : await actor.makeUnskilledAttempt(rollOptions);
    const trait = skillItem?.name ?? UNSKILLED;
    const base = await completeTraitRoll(this.game, roll, {
      actor,
      tokenId,
      trait,
      targetNumber,
      showInChat: options.showInChat,
      flavor: `${trait} ${localize(this.game, 'SWADE.SkillTest', 'Skill Test')} - ${weapon.name}`
    });

    const outcome: {
      weapon: SwadeAttackWeapon;
      target?: SwadeAttackTarget;
      hit: boolean;
    } = {
      weapon: {
        id: weapon.id,
        name: weapon.name,
        damage: weapon.system.damage ?? '',
        ap: weapon.system.ap ?? 0,
        range: weapon.system.range ?? '',
        isMelee
      },
      hit: base.successes >= 1
    };
    if (targetToken && parry !== undefined) {
      outcome.target = {
        tokenId: targetToken.tokenId,
        actorId: targetToken.actor.id,
        name: targetToken.name,
        parry
      };
    }
    return { ...base, ...outcome };
  }

  async rollDamage(target: SwadeActorTarget, itemId: string, options: DamageRollOptions): Promise<SwadeDamageRollOutcome> {
    const { actor, tokenId } = resolveSwadeActor(this.game, target);
    const weapon = this.requireWeapon(actor, itemId);
    if ((weapon.system.damage ?? '').trim() === '') {
      throw new ValidationError(`Weapon has no damage: ${itemId}`);
    }

    const additionalMods: FoundrySwadeRollModifier[] = [];
    const dmgMod = weapon.system.actions?.dmgMod ?? '';
    if (dmgMod.trim() !== '') {
      additionalMods.push({ label: 'Damage modifier', value: dmgMod });
    }
    if (options.raise) {
      const dice = weapon.system.bonusDamageDice ?? 1;
      const sides = weapon.system.bonusDamageDie ?? 6;
      additionalMods.push({ label: 'Raise', value: `+${String(dice)}d${String(sides)}x` });
    }
    const caller = callerModifier(options.modifier, options.modifierLabel);
    if (caller) {
      additionalMods.push(caller);
    }

    const rollOptions: FoundrySwadeRollOptions = { suppressChat: true, isRerollable: false, additionalMods };
    if (options.ap !== undefined) {
      rollOptions.ap = options.ap;
    }
    const roll = await weapon.rollDamage(rollOptions);
    if (!roll) {
      throw new RollResolutionError(ROLL_CANCELLED);
    }
    await roll.evaluate({ allowInteractive: false });

    const ap = (options.ap ?? weapon.system.ap ?? 0) + globalApBonus(actor);
    const total = roll.total ?? 0;
    const outcome: {
      actorId: string;
      tokenId?: string;
      weapon: { id: string; name: string };
      total: number;
      formula: string;
      dice: SwadeDamageRollOutcome['dice'];
      ap: number;
      isHeavyWeapon: boolean;
      raiseDamageIncluded: boolean;
      versusTarget?: SwadeDamagePreview;
      messageId?: string;
    } = {
      actorId: actor.id,
      weapon: { id: weapon.id, name: weapon.name },
      total,
      formula: roll.formula,
      dice: extractDamageDice(roll),
      ap,
      isHeavyWeapon: weapon.system.isHeavyWeapon === true,
      raiseDamageIncluded: options.raise
    };
    if (tokenId !== undefined) {
      outcome.tokenId = tokenId;
    }
    if (options.targetTokenId !== undefined) {
      const targetToken = resolveSwadeTargetToken(this.game, options.targetTokenId, target.sceneId);
      outcome.versusTarget = previewDamage(this.game, targetToken.actor, total, ap);
    }
    if (options.showInChat) {
      const messageData: Record<string, unknown> = {
        flavor: `${weapon.name} ${localize(this.game, 'SWADE.Dmg', 'Damage')} - ${localize(this.game, 'SWADE.Ap', 'AP')} ${String(ap)}`
      };
      const speaker = speakerFor(actor);
      if (speaker) {
        messageData['speaker'] = speaker;
      }
      const message = await roll.toMessage(messageData);
      if (typeof message?.id === 'string') {
        outcome.messageId = message.id;
      }
    }
    return outcome;
  }

  private traitRollOptions(options: TraitRollOptions): FoundrySwadeRollOptions {
    const caller = callerModifier(options.modifier, options.modifierLabel);
    return {
      suppressChat: true,
      isRerollable: false,
      ignoreWounds: options.ignoreWounds,
      additionalMods: caller ? [caller] : []
    };
  }

  private requireAttribute(actor: FoundrySwadeActor, key: SwadeAttributeKey): void {
    const attribute = actor.system.attributes?.[key];
    const usable = attribute !== undefined && actor.type !== 'group' && (actor.type !== 'vehicle' || attribute.enabled === true);
    if (!usable) {
      throw new ValidationError(`Actor has no attributes: ${actor.name}`);
    }
  }

  private requireSkillRoller(actor: FoundrySwadeActor): void {
    if (!isSkillRoller(actor)) {
      throw new ValidationError(`Only Extras and Wild Cards can roll skills: ${actor.name}`);
    }
  }

  private requireWeapon(actor: FoundrySwadeActor, itemId: string): FoundrySwadeItem {
    const item = actor.items.get(itemId);
    if (!item) {
      throw new ItemNotFoundError(itemId);
    }
    if (item.type !== 'weapon') {
      throw new ValidationError(`Item is not a weapon: ${itemId}`);
    }
    return item;
  }

  /** A skill item by id, then by name (case-insensitive), then by its `swid` slug. */
  private findSkill(actor: FoundrySwadeActor, skill: string): FoundrySwadeItem | undefined {
    const byId = actor.items.get(skill);
    if (byId && byId.type === 'skill') {
      return byId;
    }
    const needle = skill.trim().toLowerCase();
    const skills = actor.items.contents.filter((item) => item.type === 'skill');
    return (
      skills.find((item) => item.name.trim().toLowerCase() === needle) ??
      skills.find((item) => (item.system.swid ?? '').toLowerCase() === needle)
    );
  }
}
