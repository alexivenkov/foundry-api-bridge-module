import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import type { UseItemOptions } from '@/systems/pf1/item-use/domain';

export interface UseItemCommand {
  readonly target: Pf1ActorTarget;
  /** Item id or name. */
  readonly item: string;
  readonly options: UseItemOptions;
}
