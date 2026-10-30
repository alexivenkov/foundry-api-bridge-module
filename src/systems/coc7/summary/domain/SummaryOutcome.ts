import type {
  Coc7CharacteristicKey,
  Coc7Conditions,
  Coc7SkillRef,
  Coc7StatusSummary,
  Coc7WeaponDamageFormulas
} from '@/systems/coc7/shared/domain';

export interface Coc7CharacteristicSummary {
  readonly key: Coc7CharacteristicKey;
  readonly label: string;
  readonly value: number;
  readonly half: number;
  readonly fifth: number;
}

export interface Coc7PoolSummary {
  readonly value: number;
  readonly max: number;
}

export interface Coc7SanitySummary {
  readonly value: number;
  readonly max: number;
  readonly dailyLoss: number;
  readonly dailyLimit: number;
  readonly mythosHardened: boolean;
}

export interface Coc7AttributesSummary {
  readonly hp: Coc7PoolSummary;
  readonly mp: Coc7PoolSummary;
  readonly sanity: Coc7SanitySummary;
  readonly luck: number;
  readonly mov: number;
  readonly db: string;
  readonly build: number;
  readonly armor: string;
}

export interface Coc7SkillSummary {
  readonly id: string;
  readonly name: string;
  readonly value: number;
  readonly half: number;
  readonly fifth: number;
  readonly base: string;
  readonly specialization?: string;
  readonly push: boolean;
  readonly fighting: boolean;
  readonly firearm: boolean;
  readonly special: boolean;
  readonly rare: boolean;
  readonly development: boolean;
}

export interface Coc7WeaponSummary {
  readonly id: string;
  readonly name: string;
  readonly skill?: Coc7SkillRef;
  readonly alternativeSkill?: Coc7SkillRef;
  readonly ranged: boolean;
  readonly damage: Coc7WeaponDamageFormulas;
  readonly range: { readonly normal: string; readonly long?: string; readonly extreme?: string };
  readonly usesPerRound: string;
  readonly bullets?: number;
  readonly ammo?: number;
  readonly malfunction?: number;
  readonly impaling: boolean;
  readonly properties: readonly string[];
}

export interface Coc7SpellSummary {
  readonly id: string;
  readonly name: string;
  readonly costs: {
    readonly hitPoints: string;
    readonly magicPoints: string;
    readonly sanity: string;
    readonly power: string;
    readonly others: string;
  };
}

export interface Coc7CreatureSummary {
  readonly sanLoss: { readonly passed: string; readonly failed: string };
  readonly attacksPerRound: string;
}

export interface Coc7VehicleSummary {
  readonly hp?: number;
  readonly mov?: number;
  readonly build?: number;
  readonly armor?: number;
  readonly crew: string;
  readonly armed: boolean;
}

export interface Coc7ActorSummaryOutcome {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly characteristics: readonly Coc7CharacteristicSummary[];
  readonly attributes?: Coc7AttributesSummary;
  readonly conditions: Coc7Conditions;
  readonly statuses: readonly Coc7StatusSummary[];
  readonly skills: readonly Coc7SkillSummary[];
  readonly weapons: readonly Coc7WeaponSummary[];
  readonly spells: readonly Coc7SpellSummary[];
  readonly infos: { readonly occupation: string; readonly age: string; readonly archetype?: string; readonly organization?: string };
  readonly creditRating?: number;
  readonly creature?: Coc7CreatureSummary;
  readonly vehicle?: Coc7VehicleSummary;
}
