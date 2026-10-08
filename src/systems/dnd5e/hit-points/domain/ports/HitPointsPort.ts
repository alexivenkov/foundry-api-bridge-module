import type { HitPointsChangeOutcome } from '@/systems/dnd5e/hit-points/domain/HitPointsOutcome';

/** The actor to change: a world actor, or one token's actor (unlinked tokens keep their own HP). */
export interface HitPointsTarget {
  readonly actorId: string | undefined;
  readonly tokenId: string | undefined;
  readonly sceneId: string | undefined;
}

export interface HitPointsPort {
  applyDamage(target: HitPointsTarget, amount: number, damageType: string | undefined): Promise<HitPointsChangeOutcome>;
  applyHealing(target: HitPointsTarget, amount: number): Promise<HitPointsChangeOutcome>;
}
