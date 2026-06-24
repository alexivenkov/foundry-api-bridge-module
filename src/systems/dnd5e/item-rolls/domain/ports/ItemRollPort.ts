import type { RollOutcome } from '@/systems/shared/domain';

export interface AttackRollOptions {
  readonly advantage: boolean;
  readonly disadvantage: boolean;
  readonly showInChat: boolean;
}

/**
 * Outbound port for rolls made on an item's attack activity. Implemented per
 * game system by an infrastructure gateway (anti-corruption layer over Foundry).
 */
export interface DamageRollOptions {
  readonly critical: boolean;
  readonly showInChat: boolean;
}

export interface ItemRollPort {
  rollAttack(actorId: string, itemId: string, options: AttackRollOptions): Promise<RollOutcome>;
  rollDamage(actorId: string, itemId: string, options: DamageRollOptions): Promise<RollOutcome>;
}
