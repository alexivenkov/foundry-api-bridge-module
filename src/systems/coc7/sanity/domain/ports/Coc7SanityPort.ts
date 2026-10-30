import type { Coc7ActorTarget, Coc7Difficulty } from '@/systems/coc7/shared/domain';
import type { Coc7BoutOfMadnessOutcome, Coc7SanityCheckOutcome } from '../SanityOutcome';

export interface SanityCheckOptions {
  readonly lossPassed: string | number;
  readonly lossFailed: string | number;
  readonly reason: string | undefined;
  readonly difficulty: Coc7Difficulty | undefined;
  readonly bonusDice: number;
  readonly penaltyDice: number;
  readonly apply: boolean;
  readonly showInChat: boolean;
}

export interface BoutOfMadnessOptions {
  /** true: rounds; false: hours (the summary bout). */
  readonly realTime: boolean;
  readonly duration: number;
}

/** Outbound port for CoC7 Sanity: the check and the loss are the module's, the bookkeeping is the system's. */
export interface Coc7SanityPort {
  sanityCheck(target: Coc7ActorTarget, options: SanityCheckOptions): Promise<Coc7SanityCheckOutcome>;
  boutOfMadness(target: Coc7ActorTarget, options: BoutOfMadnessOptions): Promise<Coc7BoutOfMadnessOutcome>;
}
