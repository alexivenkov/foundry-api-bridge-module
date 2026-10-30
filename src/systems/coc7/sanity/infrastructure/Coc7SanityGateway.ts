import { ValidationError } from '@/systems/shared/domain/errors';
import type { Coc7ActorTarget, Coc7CheckOutcome } from '@/systems/coc7/shared/domain';
import {
  FoundryCoc7DiceRoller,
  checkCardLines,
  hasAttribs,
  isPlainNumber,
  postCoc7Card,
  readCoc7Conditions,
  resolveCoc7Actor,
  rollCoc7Check,
  settingFlag,
  settingValue,
  stripHtml,
  type Coc7DiceRoller,
  type FoundryCoc7Game,
  type FoundryRollLike
} from '@/systems/coc7/shared/infrastructure';
import {
  capSanityLoss,
  sanityAfterLoss,
  sanityLossFormula,
  type BoutOfMadnessOptions,
  type Coc7BoutOfMadnessOutcome,
  type Coc7SanityCheckOutcome,
  type Coc7SanityImmunity,
  type Coc7SanityPort,
  type SanityCheckOptions
} from '@/systems/coc7/sanity/domain';
import { foundryUuidResolver, type UuidResolver } from './foundryCoc7SanityTypes';

export const BOUT_TABLE_NOT_CONFIGURED = 'Bout of Madness table is not configured';

/**
 * Anti-corruption layer over CoC7 Sanity (CoC7 8.16). `CoC7SanCheckCard` is
 * not exported and `actor.loseSan` → `setSan` opens the spend-Luck dialog
 * under the pulp rule, so the gateway rolls the SAN check and the loss itself,
 * asks the system for immunity and the per-reason cap (`hasTempoInsane`,
 * `maxLossToSanReason`, `useMythosHardened`) and writes what `setSan` would
 * (SAN, `dailyLoss`, `setReasonSanLoss`, Temporary / Indefinite Insanity)
 * without the dialog. Bouts of Madness go through `actor.enterBoutOfMadness`.
 */
export class Coc7SanityGateway implements Coc7SanityPort {
  constructor(
    private readonly game: FoundryCoc7Game,
    private readonly dice: Coc7DiceRoller = new FoundryCoc7DiceRoller(),
    private readonly resolveUuid: UuidResolver = foundryUuidResolver()
  ) {}

  async sanityCheck(target: Coc7ActorTarget, options: SanityCheckOptions): Promise<Coc7SanityCheckOutcome> {
    const { actor, token, tokenId } = resolveCoc7Actor(this.game, target);
    if (!hasAttribs(actor)) {
      throw new ValidationError(`Actor has no sanity: ${actor.name}`);
    }
    const san = actor.system.attribs.san;
    const sanBefore = san.value ?? 0;
    const sanMax = san.max;
    const dailyLoss = san.dailyLoss;
    const dailyLimit = san.dailyLimit;

    const { resolution, rolls } = await rollCoc7Check(this.game, this.dice, sanBefore, {
      difficulty: options.difficulty,
      bonusDice: options.bonusDice,
      penaltyDice: options.penaltyDice,
      flatDiceModifier: 0,
      flatThresholdModifier: 0,
      blind: false,
      showInChat: false
    });
    const roll: Coc7CheckOutcome = {
      ...resolution,
      actorId: actor.id,
      ...(tokenId !== undefined ? { tokenId } : {}),
      kind: 'attribute',
      name: 'Sanity',
      canPush: false,
      markedForDevelopment: false
    };

    const reason = options.reason !== undefined && options.reason.trim() !== '' ? options.reason : undefined;
    let immune: Coc7SanityImmunity = 'none';
    if (actor.hasTempoInsane) {
      immune = 'bout';
    } else if (reason !== undefined && actor.maxLossToSanReason(reason, options.lossFailed) === 0) {
      immune = 'reason';
    }

    const cardRolls: FoundryRollLike[] = [...rolls];
    let lossFormula = '';
    let lossRolled = 0;
    let loss = 0;
    let limitedByReason = false;
    const mythosHardened = immune === 'none' && actor.useMythosHardened;
    if (immune === 'none') {
      const formula = sanityLossFormula({
        isSuccess: resolution.isSuccess,
        isFumble: resolution.isFumble,
        lossPassed: options.lossPassed,
        lossFailed: options.lossFailed
      });
      lossFormula = formula.formula;
      if (isPlainNumber(formula.formula)) {
        lossRolled = Number(formula.formula.trim());
      } else {
        const lossRoll = await this.dice.rollFormula(formula.formula, {}, { maximize: formula.maximize });
        lossRolled = lossRoll.total;
        cardRolls.push(lossRoll.roll);
      }
      const capped = capSanityLoss({
        rolled: lossRolled,
        reasonCap: reason !== undefined ? actor.maxLossToSanReason(reason, options.lossFailed) : undefined,
        mythosHardened
      });
      loss = capped.loss;
      limitedByReason = capped.limitedByReason;
    }

    const after = sanityAfterLoss({ san: sanBefore, sanMax, dailyLoss, dailyLimit, loss });
    const applied = options.apply && immune === 'none';
    if (applied && loss > 0) {
      await actor.update({
        'system.attribs.san.value': after.sanAfter,
        'system.attribs.san.dailyLoss': after.dailyLossAfter
      });
      if (reason !== undefined) {
        await actor.setReasonSanLoss(reason, loss);
      }
      if (after.temporaryInsanity) {
        await actor.conditionsSet(['tempoInsane']);
      }
      if (after.indefiniteInsanity) {
        await actor.conditionsSet(['indefInsane']);
      }
    }
    const indefiniteInsanity = applied ? readCoc7Conditions(actor).indefInsane && after.indefiniteInsanity : after.indefiniteInsanity;

    const outcome: Coc7SanityCheckOutcome = {
      actorId: actor.id,
      ...(tokenId !== undefined ? { tokenId } : {}),
      roll,
      immune,
      lossFormula,
      lossRolled,
      lossApplied: loss,
      limitedByReason,
      mythosHardened,
      applied,
      sanBefore,
      sanAfter: applied ? after.sanAfter : immune === 'none' ? after.sanAfter : sanBefore,
      sanMax,
      dailyLoss: applied ? after.dailyLossAfter : dailyLoss,
      dailyLimit,
      temporaryInsanity: immune === 'none' && after.temporaryInsanity,
      indefiniteInsanity: immune === 'none' && indefiniteInsanity,
      permanentInsanity: immune === 'none' && after.permanentInsanity,
      luckOfferSkipped: settingFlag(this.game, 'pulpRuleLuckHalfSanityLoss')
    };
    if (!options.showInChat) {
      return outcome;
    }
    const lines = checkCardLines('Sanity', resolution);
    if (immune === 'bout') {
      lines.push('No SAN loss: already in a Bout of Madness');
    } else if (immune === 'reason') {
      lines.push(`No SAN loss: immune to ${reason ?? ''}`);
    } else {
      lines.push(`Lost ${String(loss)} SAN (${lossFormula}) → ${String(outcome.sanAfter)}${applied ? '' : ' (not applied)'}`);
    }
    const messageId = await postCoc7Card(this.game, { actor, token, title: 'Sanity check', lines, rolls: cardRolls, blind: false });
    return messageId !== undefined ? { ...outcome, messageId } : outcome;
  }

  async boutOfMadness(target: Coc7ActorTarget, options: BoutOfMadnessOptions): Promise<Coc7BoutOfMadnessOutcome> {
    const { actor, tokenId } = resolveCoc7Actor(this.game, target);
    const key = options.realTime ? 'boutOfMadnessRealTimeTable' : 'boutOfMadnessSummaryTable';
    const uuid = settingValue(this.game, key);
    if (typeof uuid !== 'string' || uuid === '' || uuid === 'none') {
      throw new ValidationError(BOUT_TABLE_NOT_CONFIGURED);
    }
    const table = await this.resolveUuid(uuid);
    if (table === null || table === undefined) {
      throw new ValidationError(BOUT_TABLE_NOT_CONFIGURED);
    }
    const result = await actor.enterBoutOfMadness(options.realTime, options.duration);
    return {
      actorId: actor.id,
      ...(tokenId !== undefined ? { tokenId } : {}),
      name: result.name,
      description: stripHtml(result.description ?? ''),
      phobia: result.phobia,
      mania: result.mania,
      realTime: options.realTime,
      duration: options.duration,
      tempoInsane: options.realTime || readCoc7Conditions(actor).tempoInsane
    };
  }
}
