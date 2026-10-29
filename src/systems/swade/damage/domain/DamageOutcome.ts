import type { SwadeTraitRollOutcome } from '@/systems/swade/shared/domain';
import type { SwadeDamagePreview } from './damageRule';

export interface SwadeApplyDamageOutcome extends SwadeDamagePreview {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly applied: boolean;
  readonly shakenBefore: boolean;
  readonly shakenAfter: boolean;
  readonly woundsBefore: number;
  readonly woundsAfter: number;
  readonly woundsMax: number;
  readonly incapacitated: boolean;
  readonly canSoak: boolean;
}

export interface SwadeSoakOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly roll: SwadeTraitRollOutcome;
  readonly woundsSoaked: number;
  readonly woundsRemaining: number;
  readonly woundsAfter: number;
  readonly bennySpent: boolean;
  readonly benniesLeft: number;
  readonly shakenRemoved: boolean;
}
