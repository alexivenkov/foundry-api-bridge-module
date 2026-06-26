import type { RollOutcome } from '@/systems/shared/domain';
import type { StrikeListOutcome } from '@/systems/pf2e/strikes/domain/StrikeOutcome';

export interface StrikeRollOptions {
  readonly showInChat: boolean;
}

/**
 * Outbound port for PF2e weapon strikes via `actor.system.actions`. The strike
 * is identified by its weapon slug; MAP increase (0/1/2) selects the attack
 * variant. Validated into PF2e value-objects inside the gateway.
 */
export interface Pf2eStrikePort {
  listStrikes(actorId: string): Promise<StrikeListOutcome>;
  rollStrike(actorId: string, slug: string, mapIncrease: number, options: StrikeRollOptions): Promise<RollOutcome>;
  rollStrikeDamage(actorId: string, slug: string, critical: boolean, options: StrikeRollOptions): Promise<RollOutcome>;
}
