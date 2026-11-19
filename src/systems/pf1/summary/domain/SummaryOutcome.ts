import type { Pf1AbilityKey, Pf1HealthState, Pf1SaveKey } from '@/systems/pf1/shared/domain';

export interface Pf1AbilitySummary {
  readonly total: number | null;
  readonly mod: number | null;
  readonly damage: number;
  readonly drain: number;
}

export interface Pf1SkillSummary {
  /** The id `pf1/roll-skill` takes: `per`, `crf.alchemy`. */
  readonly id: string;
  readonly name: string;
  readonly mod: number | null;
  readonly rank: number;
  readonly classSkill: boolean;
  readonly trainedOnly: boolean;
}

export interface Pf1SpellbookSummary {
  readonly id: string;
  readonly name: string;
  readonly class: string;
  readonly casterLevel: number | null;
  readonly concentration: number | null;
}

/** An item `pf1/use-item` can use: it has at least one action. */
export interface Pf1UsableItemSummary {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly actions: readonly { readonly id: string; readonly name: string }[];
}

export interface Pf1SpellSummary {
  readonly id: string;
  readonly name: string;
  readonly level: number | null;
  readonly spellbook: string;
  readonly prepared: number | null;
  readonly preparedMax: number | null;
}

export interface Pf1ActorSummary {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly name: string;
  readonly type: string;
  readonly level: number | null;
  readonly cr: number | null;
  readonly alignment: string | null;
  readonly abilities: Partial<Record<Pf1AbilityKey, Pf1AbilitySummary>>;
  readonly health: Pf1HealthState | null;
  readonly ac: { readonly normal: number | null; readonly touch: number | null; readonly flatFooted: number | null };
  readonly cmb: number | null;
  readonly cmd: number | null;
  readonly cmdFlatFooted: number | null;
  readonly bab: number | null;
  readonly initiative: number | null;
  readonly sr: number | null;
  readonly saves: Partial<Record<Pf1SaveKey, number | null>>;
  /** Movement modes with a non-zero speed, in feet. */
  readonly speed: Readonly<Record<string, number>>;
  readonly conditions: readonly string[];
  readonly classes: readonly { readonly id: string; readonly name: string; readonly level: number | null }[];
  readonly skills: readonly Pf1SkillSummary[];
  readonly spellbooks: readonly Pf1SpellbookSummary[];
  readonly spells: readonly Pf1SpellSummary[];
  readonly usableItems: readonly Pf1UsableItemSummary[];
  readonly activeBuffs: readonly { readonly id: string; readonly name: string; readonly level: number | null }[];
}
