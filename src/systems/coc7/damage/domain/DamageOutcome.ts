import type { Coc7Conditions } from '@/systems/coc7/shared/domain';

export interface Coc7ApplyDamageOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly applied: number;
  readonly armorAbsorbed: number;
  readonly healed: number;
  readonly hpBefore: number;
  readonly hpAfter: number;
  readonly hpMax: number;
  readonly majorWound: boolean;
  readonly unconscious: boolean;
  readonly dying: boolean;
  readonly dead: boolean;
  readonly conditions: Coc7Conditions;
}
