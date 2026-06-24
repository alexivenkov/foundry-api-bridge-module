import type { UseItemOutcome } from '@/systems/dnd5e/item-actions/domain/UseItemOutcome';

export interface UseItemOptions {
  readonly activityId: string | undefined;
  readonly activityType: string | undefined;
  readonly consume: boolean;
  readonly scaling: number | false;
  readonly showInChat: boolean;
}

/**
 * Outbound port for using an item (cast/consume/attack). Implemented per game
 * system by an infrastructure gateway (anti-corruption layer over Foundry).
 */
export interface ItemUsePort {
  use(actorId: string, itemId: string, options: UseItemOptions): Promise<UseItemOutcome>;
}
