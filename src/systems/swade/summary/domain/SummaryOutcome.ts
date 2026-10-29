import type { SwadeAttributeKey } from '@/systems/swade/shared/domain';

export interface SwadeAttributeSummary {
  readonly die: number;
  readonly modifier: number;
  readonly wildDie: number;
}

export interface SwadeSkillSummary {
  readonly id: string;
  readonly name: string;
  readonly die: number;
  readonly modifier: number;
  readonly wildDie: number;
  readonly attribute: string;
}

export interface SwadeWeaponSummary {
  readonly id: string;
  readonly name: string;
  readonly damage: string;
  readonly ap: number;
  readonly rof: number;
  readonly range: string;
  readonly parry: number;
  readonly minStr: string;
  readonly trait: string;
  readonly traitMod: string;
  readonly dmgMod: string;
  readonly equipStatus: number;
  readonly shots: number;
  readonly currentShots: number;
  readonly isMelee: boolean;
  readonly isHeavyWeapon: boolean;
}

export interface SwadePowerSummary {
  readonly id: string;
  readonly name: string;
  readonly pp: number;
  readonly arcane: string;
  readonly rank: string;
  readonly range: string;
  readonly duration: string;
  readonly damage: string;
}

export interface SwadeStatusSummary {
  readonly shaken: boolean;
  readonly stunned: boolean;
  readonly distracted: boolean;
  readonly vulnerable: boolean;
  readonly entangled: boolean;
  readonly bound: boolean;
  readonly incapacitated: boolean;
  readonly active: readonly string[];
}

export interface SwadeInitiativeSummary {
  readonly levelHeaded: boolean;
  readonly improvedLevelHeaded: boolean;
  readonly quick: boolean;
  readonly hesitant: boolean;
}

export interface SwadeVehicleSummary {
  readonly toughness: number;
  readonly armor: number;
  readonly wounds: { readonly value: number; readonly max: number };
  readonly handling: number;
  readonly topSpeed: { readonly value: number; readonly unit: string };
  readonly outOfControl: boolean;
  readonly wrecked: boolean;
}

/** A normalized read of a SWADE sheet; sections an actor type lacks are omitted. */
export interface SwadeActorSummary {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly name: string;
  readonly type: 'character' | 'npc' | 'vehicle' | 'group';
  readonly wildcard: boolean;
  readonly attributes?: Readonly<Record<SwadeAttributeKey, SwadeAttributeSummary>>;
  readonly skills?: readonly SwadeSkillSummary[];
  readonly derived?: {
    readonly parry: number;
    readonly toughness: number;
    readonly armor: number;
    readonly size: number;
    readonly pace: number;
    readonly runningDie: string | null;
  };
  readonly bennies?: { readonly value: number; readonly max: number };
  readonly wounds?: { readonly value: number; readonly max: number; readonly ignored: number; readonly penalty: number };
  readonly fatigue?: { readonly value: number; readonly max: number; readonly penalty: number };
  readonly powerPoints?: Readonly<Record<string, { readonly value: number; readonly max: number }>>;
  readonly status: SwadeStatusSummary;
  readonly conviction?: { readonly value: number; readonly active: boolean };
  readonly rank?: string;
  readonly initiative?: SwadeInitiativeSummary;
  readonly weapons: readonly SwadeWeaponSummary[];
  readonly powers: readonly SwadePowerSummary[];
  readonly vehicle?: SwadeVehicleSummary;
}
