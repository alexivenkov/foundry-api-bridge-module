/**
 * Minimal anti-corruption view of the CoC7 system API (CoC7 8.16, Foundry
 * 12–14). Only the members the coc7/* gateways touch are modelled here; every
 * field was checked against the system's sources at tag 8.16
 * (`coc7/models/actor/document-class.js`, `coc7/models/**-system.js`).
 */

import type { Coc7CharacteristicKey, Coc7ConditionId } from '@/systems/coc7/shared/domain';

export interface FoundryCoc7Characteristic {
  value: number | null;
  formula?: string;
}

export interface FoundryCoc7Pool {
  value: number | null;
  max: number | null;
  auto?: boolean;
}

export interface FoundryCoc7Attribs {
  hp: FoundryCoc7Pool;
  mp: FoundryCoc7Pool;
  lck: { value: number | null };
  san: { value: number | null; max: number; dailyLoss: number; dailyLimit: number; auto?: boolean };
  mov: { value: number | null };
  /** A formula such as `1d4`, `-1` or `0`; the sheet derives it from STR + SIZ. */
  db: { value: string | number | null };
  build: { value: number | null };
  /** A number or a dice formula, as the sheet stores it. */
  armor: { value: string | number | null; notes?: boolean };
}

export interface FoundryCoc7TempoInsane {
  value: boolean;
  realTime: boolean;
  duration: number;
}

export type FoundryCoc7Conditions = Record<Exclude<Coc7ConditionId, 'tempoInsane'>, { value: boolean }> & {
  tempoInsane: FoundryCoc7TempoInsane;
};

export interface FoundryCoc7SanityLossEvent {
  type: string;
  totalLoss: number | null;
  immunity: boolean;
}

export interface FoundryCoc7VehicleStats {
  hp: number | null;
  mov: number | null;
  build: { value: number | null; current: number | null };
  armor: { value: number | null; localized?: boolean };
}

export interface FoundryCoc7ActorSystem {
  characteristics?: Record<Coc7CharacteristicKey, FoundryCoc7Characteristic>;
  attribs?: FoundryCoc7Attribs;
  conditions?: FoundryCoc7Conditions;
  infos?: { occupation?: string; age?: string; archetype?: string; organization?: string; type?: string };
  flags?: { mythosHardened?: boolean; mythosInsanityExperienced?: boolean; locked?: boolean };
  /** npc / creature. */
  special?: {
    sanLoss?: { checkPassed: string | null; checkFailled: string | null };
    attacksPerRound?: string;
  };
  sanityLossEvents?: FoundryCoc7SanityLossEvent[];
  /** Vehicles. */
  stats?: FoundryCoc7VehicleStats;
  crew?: { total: string };
  properties?: { armed: boolean };
}

export interface FoundryCoc7SkillProperties {
  noxpgain: boolean;
  special: boolean;
  rarity: boolean;
  push: boolean;
  fighting: boolean;
  firearm: boolean;
  ranged: boolean;
  own: boolean;
}

export interface FoundryCoc7SkillSystem {
  skillName: string;
  specialization: string;
  base: string;
  /** Getter on the data model: the adjustments' sum, overridden by Active Effects. */
  value: number;
  properties: FoundryCoc7SkillProperties;
  flags: { developement: boolean; archetype?: boolean; occupation?: boolean; experiencePackage?: boolean };
}

export interface FoundryCoc7RangeBand {
  value: string;
  damage: string;
}

export interface FoundryCoc7WeaponSystem {
  skill: { main: { id: string; name: string }; alternativ: { id: string; name: string } };
  /** Getters on the data model: the owner's skill documents; the alternative falls back to the main one. */
  skillMain: FoundryCoc7Item | undefined;
  skillAlternative: FoundryCoc7Item | undefined;
  range: { normal: FoundryCoc7RangeBand; long: FoundryCoc7RangeBand; extreme: FoundryCoc7RangeBand };
  usesPerRound: { normal: string; max: string | null; burst: string | null };
  bullets: number | null;
  ammo: number;
  malfunction: number | null;
  properties: Record<string, boolean>;
}

export interface FoundryCoc7StatusSystem {
  type: { phobia: boolean; mania: boolean };
}

export interface FoundryCoc7SpellSystem {
  costs: { hitPoints: string; magicPoints: string; sanity: string; power: string; others: string };
}

export interface FoundryCoc7Item {
  id: string;
  name: string;
  type: string;
  system: Partial<FoundryCoc7SkillSystem & FoundryCoc7WeaponSystem & FoundryCoc7StatusSystem & FoundryCoc7SpellSystem>;
  flags: { CoC7?: { cocidFlag?: { id?: string } } } & Record<string, unknown>;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryCoc7ItemsCollection {
  contents: FoundryCoc7Item[];
  get(id: string): FoundryCoc7Item | undefined;
}

export interface FoundryCoc7ActiveEffect {
  id: string;
  statuses: Set<string>;
}

export interface FoundryCoc7BoutResult {
  name: string;
  phobia: boolean;
  mania: boolean;
  description: string | null;
}

export interface FoundryCoc7Actor {
  id: string;
  name: string;
  type: string;
  system: FoundryCoc7ActorSystem;
  items: FoundryCoc7ItemsCollection;
  effects: { contents: FoundryCoc7ActiveEffect[] };
  readonly hasTempoInsane: boolean;
  readonly hasIndefInsane: boolean;
  /** `system.flags.mythosHardened && setting allowMythosHardened`. */
  readonly useMythosHardened: boolean;
  getSkillByName(name: string): FoundryCoc7Item | undefined;
  getFirstItemByCoCID(cocid: string): FoundryCoc7Item | undefined;
  hasConditionStatus(conditionName: string): boolean;
  conditionsSet(
    conditionNames: string[],
    options?: { forceValue?: boolean; realTime?: boolean | null; duration?: number | null }
  ): Promise<void>;
  conditionsUnset(conditionNames: string[], options?: { forceValue?: boolean }): Promise<void>;
  /** Returns the damage that went through armor; sets Major Wound / Unconscious / Dying / Dead itself. */
  dealDamage(amount: number, options?: { armor?: string | number | null; ignoreArmor?: boolean }): Promise<number>;
  /** Clamped to [0, max]; a decrease goes through `dealDamage` with `ignoreArmor`. Returns the new value. */
  setHp(value: number): Promise<number>;
  /** `false` when the actor is short of Luck. */
  spendLuck(amount: number): Promise<unknown>;
  /** Caps at 99 and returns the stored value. */
  setLuck(value: number): Promise<number>;
  enterBoutOfMadness(realTime: boolean, duration: number): Promise<FoundryCoc7BoutResult>;
  maxLossToSanReason(reason: string, maxFormula: string | number): number;
  getReasonSanLoss(reason: string): FoundryCoc7SanityLossEvent;
  setReasonSanLoss(reason: string, loss: number): Promise<unknown> | null;
  /** Roll data: characteristics and attributes by key, for armor formulas. */
  parsedValues(): Record<string, unknown>;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryCoc7Token {
  id: string;
  name: string;
  actor: FoundryCoc7Actor | null;
}

export interface FoundryCoc7Scene {
  id: string;
  tokens: { get(id: string): FoundryCoc7Token | undefined };
}

export interface FoundryCoc7User {
  id: string;
  isGM: boolean;
}

export interface FoundryCoc7Game {
  actors: { get(id: string): FoundryCoc7Actor | undefined };
  scenes: {
    get(id: string): FoundryCoc7Scene | undefined;
    active: FoundryCoc7Scene | null;
  };
  users?: { contents?: FoundryCoc7User[]; filter?(predicate: (user: FoundryCoc7User) => boolean): FoundryCoc7User[] };
  settings?: { get(scope: string, key: string): unknown };
  i18n?: { localize(key: string): string };
}

export function getCoc7Game(): FoundryCoc7Game {
  return (globalThis as unknown as { game: FoundryCoc7Game }).game;
}

/** `system.attribs` exists on characters, NPCs and creatures; vehicles keep `system.stats` instead. */
export function hasAttribs(actor: FoundryCoc7Actor): actor is FoundryCoc7Actor & { system: { attribs: FoundryCoc7Attribs } } {
  return actor.system.attribs !== undefined;
}
