import type { Coc7ActorTarget, Coc7Difficulty } from '@/systems/coc7/shared/domain';

export interface SanityCheckCommand {
  readonly target: Coc7ActorTarget;
  readonly lossPassed: string | number;
  readonly lossFailed: string | number;
  readonly reason: string | undefined;
  readonly difficulty: Coc7Difficulty | undefined;
  readonly bonusDice: number;
  readonly penaltyDice: number;
  readonly apply: boolean;
  readonly showInChat: boolean;
}

export interface BoutOfMadnessCommand {
  readonly target: Coc7ActorTarget;
  readonly realTime: boolean;
  readonly duration: number;
}
