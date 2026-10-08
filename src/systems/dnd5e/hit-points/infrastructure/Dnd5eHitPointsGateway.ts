import { ActorNotFoundError, TargetTokenNotFoundError, ValidationError } from '@/systems/shared/domain/errors';
import type { HitPointsChangeOutcome, HitPointsPort, HitPointsTarget } from '@/systems/dnd5e/hit-points/domain';
import type {
  FoundryDamageDescription,
  FoundryHitPointsActor,
  FoundryHitPointsGame
} from './foundryHitPointsTypes';

interface HpSnapshot {
  value: number;
  max: number;
  temp: number;
}

function snapshot(actor: FoundryHitPointsActor): HpSnapshot {
  const hp = actor.system.attributes?.hp;
  if (!hp) {
    throw new ValidationError(`Actor has no hit points: ${actor.name}`);
  }
  return { value: hp.value, max: hp.max, temp: hp.temp ?? 0 };
}

/**
 * Anti-corruption layer over dnd5e's `Actor5e#applyDamage`: temp HP absorbs
 * damage first and resistances, immunities and vulnerabilities apply when a
 * damage type is given. An unlinked token's synthetic actor is addressed by
 * `tokenId`, so the hit lands on that one copy.
 */
export class Dnd5eHitPointsGateway implements HitPointsPort {
  constructor(private readonly game: FoundryHitPointsGame) {}

  applyDamage(target: HitPointsTarget, amount: number, damageType: string | undefined): Promise<HitPointsChangeOutcome> {
    const damage: FoundryDamageDescription = { value: amount };
    if (damageType !== undefined) {
      damage.type = damageType;
    }
    return this.apply(target, [damage]);
  }

  applyHealing(target: HitPointsTarget, amount: number): Promise<HitPointsChangeOutcome> {
    return this.apply(target, [{ value: amount, type: 'healing' }]);
  }

  private async apply(
    target: HitPointsTarget,
    damages: FoundryDamageDescription[]
  ): Promise<HitPointsChangeOutcome> {
    const { actor, tokenId } = this.resolve(target);
    const before = snapshot(actor);

    await actor.applyDamage(damages);

    const after = snapshot(actor);
    const outcome: {
      actorId: string;
      tokenId?: string;
      hpBefore: number;
      hpAfter: number;
      tempBefore: number;
      tempAfter: number;
      maxHp: number;
    } = {
      actorId: actor.id,
      hpBefore: before.value,
      hpAfter: after.value,
      tempBefore: before.temp,
      tempAfter: after.temp,
      maxHp: after.max
    };
    if (tokenId !== undefined) {
      outcome.tokenId = tokenId;
    }
    return outcome;
  }

  private resolve(target: HitPointsTarget): { actor: FoundryHitPointsActor; tokenId?: string } {
    if (target.tokenId !== undefined) {
      const scene = target.sceneId !== undefined ? this.game.scenes.get(target.sceneId) : this.game.scenes.active;
      if (!scene) {
        throw new ValidationError(target.sceneId !== undefined ? `Scene not found: ${target.sceneId}` : 'No active scene');
      }
      const token = scene.tokens.get(target.tokenId);
      if (!token) {
        throw new TargetTokenNotFoundError(target.tokenId);
      }
      if (!token.actor) {
        throw new ValidationError(`Token has no actor: ${target.tokenId}`);
      }
      return { actor: token.actor, tokenId: token.id };
    }
    if (target.actorId !== undefined) {
      const actor = this.game.actors.get(target.actorId);
      if (!actor) {
        throw new ActorNotFoundError(target.actorId);
      }
      return { actor };
    }
    throw new ValidationError('Either actorId or tokenId is required');
  }
}
