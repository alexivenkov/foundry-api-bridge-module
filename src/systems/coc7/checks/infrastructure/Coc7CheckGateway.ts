import { ValidationError } from '@/systems/shared/domain/errors';
import {
  characteristicCheckName,
  characteristicOfCheck,
  type Coc7ActorTarget,
  type Coc7CheckKind,
  type Coc7CheckOptions,
  type Coc7CheckOutcome,
  type Coc7CheckResolution
} from '@/systems/coc7/shared/domain';
import {
  FoundryCoc7DiceRoller,
  checkCardLines,
  hasAttribs,
  postCoc7Card,
  requireCoc7Skill,
  resolveCoc7Actor,
  rollCoc7Check,
  settingFlag,
  type Coc7DiceRoller,
  type FoundryCoc7Game,
  type FoundryCoc7Item,
  type FoundryRollLike,
  type ResolvedCoc7Actor
} from '@/systems/coc7/shared/infrastructure';
import type {
  Coc7CheckPort,
  RollAttributeOptions,
  RollCharacteristicOptions,
  RollSkillOptions
} from '@/systems/coc7/checks/domain';

interface FinishCheck {
  readonly resolved: ResolvedCoc7Actor;
  readonly kind: Coc7CheckKind;
  readonly name: string;
  readonly title: string;
  readonly resolution: Coc7CheckResolution;
  readonly rolls: readonly FoundryRollLike[];
  readonly canPush: boolean;
  readonly markedForDevelopment: boolean;
  readonly options: Coc7CheckOptions;
}

function failedAndPushable(resolution: Coc7CheckResolution): boolean {
  return !resolution.isFumble && !resolution.isCritical && resolution.isSuccess !== true;
}

/**
 * Anti-corruption layer over CoC7 checks (CoC7 8.16). The system's
 * `CoC7Check` / `CoC7DicePool` are not exported and `actor.skillCheck` only
 * drives dialogs and cards, so the gateway reads the threshold from the sheet,
 * rolls the d10s through Foundry and resolves them with the module's own
 * `resolveCoc7Check`. The development tick mirrors `CoC7Check#flagForDevelopment`.
 */
export class Coc7CheckGateway implements Coc7CheckPort {
  constructor(
    private readonly game: FoundryCoc7Game,
    private readonly dice: Coc7DiceRoller = new FoundryCoc7DiceRoller()
  ) {}

  async rollSkill(target: Coc7ActorTarget, { skill: reference, options }: RollSkillOptions): Promise<Coc7CheckOutcome> {
    const resolved = resolveCoc7Actor(this.game, target);
    const skill = requireCoc7Skill(resolved.actor, reference);
    const { resolution, rolls } = await rollCoc7Check(this.game, this.dice, skill.system.value ?? 0, options);
    const pushable = skill.system.properties?.push === true;
    const markedForDevelopment = await this.tickDevelopment(skill, resolution, options);
    return this.finish({
      resolved,
      kind: 'skill',
      name: skill.name,
      title: `${skill.name} check`,
      resolution,
      rolls,
      canPush: pushable && failedAndPushable(resolution),
      markedForDevelopment,
      options
    });
  }

  async rollCharacteristic(
    target: Coc7ActorTarget,
    { characteristic, options }: RollCharacteristicOptions
  ): Promise<Coc7CheckOutcome> {
    const resolved = resolveCoc7Actor(this.game, target);
    const characteristics = resolved.actor.system.characteristics;
    if (characteristics === undefined) {
      throw new ValidationError(`Actor has no characteristics: ${resolved.actor.name}`);
    }
    const key = characteristicOfCheck(characteristic);
    const name = characteristicCheckName(characteristic);
    const { resolution, rolls } = await rollCoc7Check(this.game, this.dice, characteristics[key].value ?? 0, options);
    return this.finish({
      resolved,
      kind: 'characteristic',
      name,
      title: `${name} check`,
      resolution,
      rolls,
      canPush: failedAndPushable(resolution),
      markedForDevelopment: false,
      options
    });
  }

  async rollAttribute(target: Coc7ActorTarget, { attribute, options }: RollAttributeOptions): Promise<Coc7CheckOutcome> {
    const resolved = resolveCoc7Actor(this.game, target);
    const { actor } = resolved;
    const name = attribute === 'luck' ? 'Luck' : 'Sanity';
    if (!hasAttribs(actor)) {
      throw new ValidationError(`Actor has no ${attribute}: ${actor.name}`);
    }
    const threshold = attribute === 'luck' ? actor.system.attribs.lck.value : actor.system.attribs.san.value;
    const { resolution, rolls } = await rollCoc7Check(this.game, this.dice, threshold ?? 0, options);
    return this.finish({
      resolved,
      kind: 'attribute',
      name,
      title: `${name} check`,
      resolution,
      rolls,
      canPush: attribute === 'luck' && failedAndPushable(resolution),
      markedForDevelopment: false,
      options
    });
  }

  private async tickDevelopment(skill: FoundryCoc7Item, resolution: Coc7CheckResolution, options: Coc7CheckOptions): Promise<boolean> {
    if (!settingFlag(this.game, 'xpEnabled') || resolution.difficulty === 'unknown' || options.blind) {
      return false;
    }
    if (skill.system.properties?.noxpgain === true || skill.system.flags?.developement !== false) {
      return false;
    }
    if (!resolution.isRolledSuccess) {
      return false;
    }
    await skill.update({ 'system.flags.developement': true });
    return true;
  }

  private async finish(check: FinishCheck): Promise<Coc7CheckOutcome> {
    const { actor, token, tokenId } = check.resolved;
    const outcome: Coc7CheckOutcome = {
      ...check.resolution,
      actorId: actor.id,
      ...(tokenId !== undefined ? { tokenId } : {}),
      kind: check.kind,
      name: check.name,
      canPush: check.canPush,
      markedForDevelopment: check.markedForDevelopment
    };
    if (!check.options.showInChat) {
      return outcome;
    }
    const lines = checkCardLines(check.name, check.resolution);
    if (check.markedForDevelopment) {
      lines.push('Marked for development');
    }
    const messageId = await postCoc7Card(this.game, {
      actor,
      token,
      title: check.title,
      lines,
      rolls: check.rolls,
      blind: check.options.blind
    });
    return messageId !== undefined ? { ...outcome, messageId } : outcome;
  }
}
