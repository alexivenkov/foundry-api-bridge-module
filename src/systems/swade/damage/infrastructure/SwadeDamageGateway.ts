import { ValidationError } from '@/systems/shared/domain/errors';
import type { SwadeActorTarget } from '@/systems/swade/shared/domain';
import {
  callerModifier,
  completeTraitRoll,
  localize,
  resolveSwadeActor,
  settingFlag,
  type FoundrySwadeGame,
  type FoundrySwadeRollModifier
} from '@/systems/swade/shared/infrastructure';
import {
  computeDamage,
  type ApplyDamageOptions,
  type SoakOptions,
  type SwadeApplyDamageOutcome,
  type SwadeDamagePort,
  type SwadeSoakOutcome
} from '@/systems/swade/damage/domain';
import { snapshotDamageTarget } from './damagePreview';

const SHAKEN = 'shaken';
const INCAPACITATED = 'incapacitated';

/**
 * Anti-corruption layer over SWADE damage (swade 6.0.4). The system's
 * `DamageApplicator` only works through dialogs, so the Toughness rule is
 * reimplemented in the domain and applied here with the system's own
 * primitives: `toggleActiveEffect('shaken' | 'incapacitated')` and the
 * `system.wounds.value` update the applicator itself performs. Soaking rolls
 * Vigor through `rollAttribute` exactly as `attemptSoak` does.
 */
export class SwadeDamageGateway implements SwadeDamagePort {
  constructor(private readonly game: FoundrySwadeGame) {}

  async applyDamage(target: SwadeActorTarget, options: ApplyDamageOptions): Promise<SwadeApplyDamageOutcome> {
    const { actor, tokenId } = resolveSwadeActor(this.game, target);
    const snapshot = snapshotDamageTarget(actor);
    const preview = computeDamage({
      ...snapshot,
      damage: options.damage,
      ap: options.ap,
      woundCap: settingFlag(this.game, 'woundCap')
    });

    let shakenAfter = snapshot.alreadyShaken;
    let woundsAfter = snapshot.woundsBefore;
    let incapacitated = actor.statuses.has(INCAPACITATED);

    if (options.apply) {
      if (preview.outcome !== 'none' && !snapshot.isVehicle && !snapshot.alreadyShaken) {
        await actor.toggleActiveEffect(SHAKEN, { active: true });
        shakenAfter = true;
      }
      if (preview.woundsInflicted > 0) {
        woundsAfter = Math.min(snapshot.woundsMax, snapshot.woundsBefore + preview.woundsInflicted);
        await actor.update({ 'system.wounds.value': woundsAfter });
      }
      if (preview.wouldIncapacitate && !incapacitated) {
        await actor.toggleActiveEffect(INCAPACITATED, { active: true });
        incapacitated = true;
      }
    }

    const outcome: {
      actorId: string;
      tokenId?: string;
      applied: boolean;
      shakenBefore: boolean;
      shakenAfter: boolean;
      woundsBefore: number;
      woundsAfter: number;
      woundsMax: number;
      incapacitated: boolean;
      canSoak: boolean;
    } = {
      actorId: actor.id,
      applied: options.apply,
      shakenBefore: snapshot.alreadyShaken,
      shakenAfter: shakenAfter || actor.statuses.has(SHAKEN),
      woundsBefore: snapshot.woundsBefore,
      woundsAfter,
      woundsMax: snapshot.woundsMax,
      incapacitated,
      canSoak: options.apply && preview.woundsInflicted > 0 && actor.isWildcard && actor.bennies > 0
    };
    if (tokenId !== undefined) {
      outcome.tokenId = tokenId;
    }
    return { ...preview, ...outcome };
  }

  async soak(target: SwadeActorTarget, options: SoakOptions): Promise<SwadeSoakOutcome> {
    const { actor, tokenId } = resolveSwadeActor(this.game, target);
    if (!actor.isWildcard) {
      throw new ValidationError(`Only Wild Cards can soak: ${actor.name}`);
    }

    let bennySpent = false;
    if (options.spendBenny) {
      if (actor.bennies < 1) {
        throw new ValidationError(`No bennies left: ${actor.name}`);
      }
      const spent = await actor.spendBenny();
      if (!spent) {
        throw new ValidationError(`No bennies left: ${actor.name}`);
      }
      bennySpent = true;
    }

    const additionalMods: FoundrySwadeRollModifier[] = [
      {
        label: localize(this.game, 'SWADE.DamageApplicator.SoakModifier', 'Soak bonus'),
        value: actor.system.attributes?.vigor?.soakBonus ?? 0
      }
    ];
    if (settingFlag(this.game, 'unarmoredHero') && actor.isUnarmored === true) {
      additionalMods.push({ label: localize(this.game, 'SWADE.Settings.UnarmoredHero.Name', 'Unarmored Hero'), value: 2 });
    }
    const caller = callerModifier(options.modifier, options.modifierLabel);
    if (caller) {
      additionalMods.push(caller);
    }

    const roll = await actor.rollAttribute('vigor', { suppressChat: true, isRerollable: false, additionalMods });
    const rollOutcome = await completeTraitRoll(this.game, roll, {
      actor,
      tokenId,
      trait: 'vigor',
      targetNumber: 4,
      showInChat: options.showInChat,
      flavor: localize(this.game, 'SWADE.DamageApplicator.SoakDialog.SoakRoll', 'Soak Roll')
    });

    const woundsSoaked = Math.max(0, Math.min(options.wounds, rollOutcome.successes));
    const woundsBefore = actor.system.wounds?.value ?? 0;
    const woundsAfter = Math.max(0, woundsBefore - woundsSoaked);
    if (woundsAfter !== woundsBefore) {
      await actor.update({ 'system.wounds.value': woundsAfter });
    }

    let shakenRemoved = false;
    if (woundsSoaked >= options.wounds) {
      if (actor.statuses.has(SHAKEN)) {
        await actor.toggleActiveEffect(SHAKEN, { active: false });
        shakenRemoved = true;
      }
      if (options.clearIncapacitated && actor.statuses.has(INCAPACITATED)) {
        await actor.toggleActiveEffect(INCAPACITATED, { active: false });
      }
    }

    const outcome: {
      actorId: string;
      tokenId?: string;
      roll: SwadeSoakOutcome['roll'];
      woundsSoaked: number;
      woundsRemaining: number;
      woundsAfter: number;
      bennySpent: boolean;
      benniesLeft: number;
      shakenRemoved: boolean;
    } = {
      actorId: actor.id,
      roll: rollOutcome,
      woundsSoaked,
      woundsRemaining: options.wounds - woundsSoaked,
      woundsAfter,
      bennySpent,
      benniesLeft: actor.bennies,
      shakenRemoved
    };
    if (tokenId !== undefined) {
      outcome.tokenId = tokenId;
    }
    return outcome;
  }
}
