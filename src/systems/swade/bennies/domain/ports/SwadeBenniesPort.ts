import type { SwadeActorTarget } from '@/systems/swade/shared/domain';
import type { SwadeBenniesOutcome } from '@/systems/swade/bennies/domain/BenniesOutcome';
import type { SwadeBennyAction } from '@/systems/swade/bennies/domain/value-objects';

/** Outbound port for bennies: an actor's pool via `spendBenny`/`getBenny`/`refreshBennies`, or the GM's on `game.user`. */
export interface SwadeBenniesPort {
  actorBennies(target: SwadeActorTarget, action: SwadeBennyAction): Promise<SwadeBenniesOutcome>;
  gmBennies(action: SwadeBennyAction): Promise<SwadeBenniesOutcome>;
}
