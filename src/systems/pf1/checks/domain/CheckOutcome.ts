import type { Pf1D20RollOutcome } from '@/systems/pf1/shared/domain';

export type Pf1CheckKind = 'ability' | 'skill' | 'save' | 'caster-level' | 'concentration';

/** A pf1 d20 check: the roll, what was checked and, when a DC was given, the verdict. */
export interface Pf1CheckOutcome extends Pf1D20RollOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly kind: Pf1CheckKind;
  /** `str`, `per`, `crf.alchemy`, `fort`, `primary`, … */
  readonly id: string;
  readonly name: string;
  readonly dc?: number;
  /** Only with a DC. Saves follow the natural 1 / natural 20 rule. */
  readonly isSuccess?: boolean;
  readonly isNat20: boolean;
  readonly isNat1: boolean;
  readonly messageId?: string;
}
