import { ValidationError } from '@/systems/shared/domain/errors';
import type {
  Pf1AbilityKey,
  Pf1ActorTarget,
  Pf1CheckOptions,
  Pf1SaveKey
} from '@/systems/pf1/shared/domain';
import {
  readD20Result,
  resolvePf1Actor,
  resolvePf1Skill,
  toD20RollOutcome,
  type FoundryPf1Actor,
  type FoundryPf1Game,
  type FoundryPf1RollOptions,
  type FoundryPf1RollResult
} from '@/systems/pf1/shared/infrastructure';
import type { Pf1CheckKind, Pf1CheckOutcome, Pf1CheckPort } from '@/systems/pf1/checks/domain';

const ABILITY_NAMES: Record<Pf1AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma'
};

const SAVE_NAMES: Record<Pf1SaveKey, string> = {
  fort: 'Fortitude',
  ref: 'Reflex',
  will: 'Will'
};

interface CheckSubject {
  readonly kind: Pf1CheckKind;
  readonly id: string;
  readonly name: string;
}

/**
 * Anti-corruption layer between the pf1 check port and the actor's roll
 * methods (pf1 11.11). Every roll runs with `skipDialog: true`; with
 * `chatMessage: false` the system answers the message data instead of posting
 * it, so the roll is still fully evaluated by the system.
 */
export class Pf1CheckGateway implements Pf1CheckPort {
  constructor(private readonly game: FoundryPf1Game) {}

  async rollAbility(target: Pf1ActorTarget, ability: Pf1AbilityKey, options: Pf1CheckOptions): Promise<Pf1CheckOutcome> {
    const { actor, tokenId } = resolvePf1Actor(this.game, target);
    if (actor.system.abilities?.[ability] === undefined) {
      throw new ValidationError(`Actor has no ability scores: ${actor.name}`);
    }
    const subject = { kind: 'ability', id: ability, name: ABILITY_NAMES[ability] } as const;
    return this.run(actor, tokenId, subject, options, actor.rollAbilityTest(ability, rollOptions(options)));
  }

  async rollSkill(target: Pf1ActorTarget, skill: string, options: Pf1CheckOptions): Promise<Pf1CheckOutcome> {
    const { actor, tokenId } = resolvePf1Actor(this.game, target);
    const resolved = resolvePf1Skill(actor, skill);
    const subject = { kind: 'skill', id: resolved.id, name: resolved.name } as const;
    return this.run(actor, tokenId, subject, options, actor.rollSkill(resolved.id, rollOptions(options)));
  }

  async rollSave(target: Pf1ActorTarget, save: Pf1SaveKey, options: Pf1CheckOptions): Promise<Pf1CheckOutcome> {
    const { actor, tokenId } = resolvePf1Actor(this.game, target);
    if (actor.system.attributes?.savingThrows?.[save] === undefined) {
      throw new ValidationError(`Actor has no saving throws: ${actor.name}`);
    }
    const subject = { kind: 'save', id: save, name: SAVE_NAMES[save] } as const;
    return this.run(actor, tokenId, subject, options, actor.rollSavingThrow(save, rollOptions(options)));
  }

  async rollCasterLevel(target: Pf1ActorTarget, spellbook: string, options: Pf1CheckOptions): Promise<Pf1CheckOutcome> {
    const { actor, tokenId } = resolvePf1Actor(this.game, target);
    const name = this.requireSpellbook(actor, spellbook);
    const subject = { kind: 'caster-level', id: spellbook, name } as const;
    return this.run(actor, tokenId, subject, options, actor.rollCL(spellbook, rollOptions(options)));
  }

  async rollConcentration(target: Pf1ActorTarget, spellbook: string, options: Pf1CheckOptions): Promise<Pf1CheckOutcome> {
    const { actor, tokenId } = resolvePf1Actor(this.game, target);
    const name = this.requireSpellbook(actor, spellbook);
    const subject = { kind: 'concentration', id: spellbook, name } as const;
    return this.run(actor, tokenId, subject, options, actor.rollConcentration(spellbook, rollOptions(options)));
  }

  private async run(
    actor: FoundryPf1Actor,
    tokenId: string | undefined,
    subject: CheckSubject,
    options: Pf1CheckOptions,
    rolling: Promise<FoundryPf1RollResult | undefined>
  ): Promise<Pf1CheckOutcome> {
    const { roll, messageId } = readD20Result(await rolling);
    const d20 = toD20RollOutcome(roll);
    const dc = options.dc;
    const outcome: {
      -readonly [K in keyof Pf1CheckOutcome]: Pf1CheckOutcome[K];
    } = {
      actorId: actor.id,
      kind: subject.kind,
      id: subject.id,
      name: subject.name,
      ...d20,
      isNat20: !d20.isStatic && d20.natural === 20,
      isNat1: !d20.isStatic && d20.natural === 1
    };
    if (tokenId !== undefined) {
      outcome.tokenId = tokenId;
    }
    if (dc !== undefined) {
      outcome.dc = dc;
      outcome.isSuccess = isSuccess(subject.kind, d20.total, dc, outcome.isNat20, outcome.isNat1);
    }
    if (messageId !== undefined) {
      outcome.messageId = messageId;
    }
    return outcome;
  }

  /** The book's display name; the book must exist and be in use. */
  private requireSpellbook(actor: FoundryPf1Actor, spellbook: string): string {
    const books = actor.system.attributes?.spells?.spellbooks ?? {};
    const inUse = Object.entries(books)
      .filter(([, book]) => book.inUse === true)
      .map(([id]) => id);
    const book = books[spellbook];
    if (book?.inUse !== true) {
      const known = inUse.length > 0 ? inUse.join(', ') : 'none';
      throw new ValidationError(`Spellbook not in use: ${spellbook}. Spellbooks in use on ${actor.name}: ${known}`);
    }
    return book.name || book.label || spellbook;
  }
}

function rollOptions(options: Pf1CheckOptions): FoundryPf1RollOptions {
  const result: FoundryPf1RollOptions = { skipDialog: true, chatMessage: options.showInChat };
  if (options.bonus !== undefined) {
    result.bonus = options.bonus;
  }
  if (options.dc !== undefined) {
    result.dc = options.dc;
  }
  if (options.takeX !== undefined) {
    result.staticRoll = options.takeX;
  }
  if (options.rollMode !== undefined) {
    result.rollMode = options.rollMode;
  }
  return result;
}

/**
 * The system's `D20RollPF.isSuccess` (total ≥ DC). Saving throws add the core
 * rule the system leaves to the GM: a natural 20 always succeeds and a natural
 * 1 always fails (Core Rulebook, Saving Throws).
 */
function isSuccess(kind: Pf1CheckKind, total: number, dc: number, nat20: boolean, nat1: boolean): boolean {
  if (kind === 'save') {
    if (nat20) return true;
    if (nat1) return false;
  }
  return total >= dc;
}
