import type { Coc7CheckOutcome } from '@/systems/coc7/shared/domain';

export type Coc7SanityImmunity = 'none' | 'bout' | 'reason';

export interface Coc7SanityCheckOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly roll: Coc7CheckOutcome;
  readonly immune: Coc7SanityImmunity;
  readonly lossFormula: string;
  readonly lossRolled: number;
  readonly lossApplied: number;
  readonly limitedByReason: boolean;
  readonly mythosHardened: boolean;
  readonly applied: boolean;
  readonly sanBefore: number;
  readonly sanAfter: number;
  readonly sanMax: number;
  readonly dailyLoss: number;
  readonly dailyLimit: number;
  readonly temporaryInsanity: boolean;
  readonly indefiniteInsanity: boolean;
  readonly permanentInsanity: boolean;
  readonly luckOfferSkipped: boolean;
  readonly messageId?: string;
}

export interface Coc7BoutOfMadnessOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly name: string;
  readonly description: string;
  readonly phobia: boolean;
  readonly mania: boolean;
  readonly realTime: boolean;
  readonly duration: number;
  readonly tempoInsane: boolean;
}
