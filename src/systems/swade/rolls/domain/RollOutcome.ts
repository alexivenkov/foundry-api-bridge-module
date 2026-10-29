import type { SwadeDieOutcome, SwadeTraitRollOutcome } from '@/systems/swade/shared/domain';
import type { SwadeDamagePreview } from '@/systems/swade/damage/domain';

export interface SwadeAttackWeapon {
  readonly id: string;
  readonly name: string;
  readonly damage: string;
  readonly ap: number;
  readonly range: string;
  readonly isMelee: boolean;
}

export interface SwadeAttackTarget {
  readonly tokenId: string;
  readonly actorId: string;
  readonly name: string;
  readonly parry: number;
}

export interface SwadeAttackRollOutcome extends SwadeTraitRollOutcome {
  readonly weapon: SwadeAttackWeapon;
  readonly target?: SwadeAttackTarget;
  readonly hit: boolean;
}

export interface SwadeDamageRollOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly weapon: { readonly id: string; readonly name: string };
  readonly total: number;
  readonly formula: string;
  readonly dice: readonly SwadeDieOutcome[];
  readonly ap: number;
  readonly isHeavyWeapon: boolean;
  readonly raiseDamageIncluded: boolean;
  readonly versusTarget?: SwadeDamagePreview;
  readonly messageId?: string;
}
