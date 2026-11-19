import { ValidationError } from '@/systems/shared/domain/errors';
import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import {
  resolvePf1Actor,
  runForActor,
  type FoundryPf1Actor,
  type FoundryPf1Game,
  type FoundryPf1HealthConfig,
  type FoundryPf1HealthData
} from '@/systems/pf1/shared/infrastructure';
import type {
  ApplyDamageOptions,
  Pf1ApplyDamageOutcome,
  Pf1DamagePort,
  Pf1HealthState
} from '@/systems/pf1/damage/domain';

function num(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function pool(data: FoundryPf1HealthData): { value: number; max: number; temp: number } {
  return { value: num(data.value), max: num(data.max), temp: num(data.temp) };
}

/**
 * Whether the Wounds & Vigor variant tracks this actor, asked the way
 * `ActorPF#applyDamage` asks it. Vigor and wounds are prepared for every actor,
 * so their values alone do not tell.
 */
export function usesWoundsAndVigor(game: FoundryPf1Game, actor: FoundryPf1Actor): boolean {
  try {
    const config = game.settings?.get('pf1', 'healthConfig') as FoundryPf1HealthConfig | undefined;
    return config?.getActorConfig(actor)?.rules?.useWoundsAndVigor === true;
  } catch {
    return false;
  }
}

/** A snapshot copied out of the live document, so the "before" state survives the update. */
export function readPf1Health(actor: FoundryPf1Actor, woundsAndVigor: boolean): Pf1HealthState {
  const attributes = actor.system.attributes ?? {};
  const hp = attributes.hp ?? {};
  const state: { -readonly [K in keyof Pf1HealthState]: Pf1HealthState[K] } = {
    hp: { ...pool(hp), nonlethal: num(hp.nonlethal) }
  };
  if (woundsAndVigor) {
    state.vigor = pool(attributes.vigor ?? {});
    state.wounds = { value: num(attributes.wounds?.value), max: num(attributes.wounds?.max) };
  }
  return state;
}

/**
 * Anti-corruption layer over `ActorPF#applyDamage` (pf1 11.11): the system
 * picks hit points or Wounds & Vigor from its health settings, drains
 * temporary HP first, tracks nonlethal damage and heals nonlethal damage along
 * with lethal when its `dualHeal` setting is on. `applied` compares the
 * health before and after: the system answers `false` when ratio and reduction
 * leave nothing, but `undefined` (not `false`) when an update changes nothing,
 * such as healing at full hit points.
 */
export class Pf1DamageGateway implements Pf1DamagePort {
  constructor(private readonly game: FoundryPf1Game) {}

  async applyDamage(target: Pf1ActorTarget, options: ApplyDamageOptions): Promise<Pf1ApplyDamageOutcome> {
    const { actor, tokenId } = resolvePf1Actor(this.game, target);
    if (actor.system.attributes?.hp === undefined) {
      throw new ValidationError(`Actor has no hit points: ${actor.name}`);
    }
    const woundsAndVigor = usesWoundsAndVigor(this.game, actor);
    const systemOptions: { asNonlethal: boolean; asWounds: boolean; reduction?: number; ratio?: number } = {
      asNonlethal: options.nonlethal,
      asWounds: options.asWounds
    };
    if (options.reduction !== undefined) {
      systemOptions.reduction = options.reduction;
    }
    if (options.ratio !== undefined) {
      systemOptions.ratio = options.ratio;
    }

    return runForActor(actor, async () => {
      const before = readPf1Health(actor, woundsAndVigor);
      await actor.applyDamage(options.value, systemOptions);
      const after = readPf1Health(actor, woundsAndVigor);
      return {
        actorId: actor.id,
        ...(tokenId !== undefined ? { tokenId } : {}),
        applied: JSON.stringify(before) !== JSON.stringify(after),
        before,
        after
      };
    });
  }
}
