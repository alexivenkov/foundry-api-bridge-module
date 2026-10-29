import type { SwadeActorTarget } from '@/systems/swade/shared/domain';
import type { SwadeBennyAction } from '@/systems/swade/bennies/domain';

export interface BenniesCommand {
  /** `undefined` addresses the GM's bennies on `game.user`. */
  readonly target: SwadeActorTarget | undefined;
  readonly action: SwadeBennyAction;
}
