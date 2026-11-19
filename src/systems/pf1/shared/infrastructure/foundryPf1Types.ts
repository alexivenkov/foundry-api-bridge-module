/**
 * Minimal anti-corruption view of the Pathfinder 1e system API (pf1 11.11,
 * Foundry v14). Only the members the pf1/* gateways touch are modelled; every
 * field and method was checked against the system's sources
 * (`module/documents/actor/actor-pf.mjs`, `module/documents/item/item-pf.mjs`,
 * `module/action-use/action-use.mjs`, `module/dice/d20roll.mjs`). Derived
 * values (`total`, `mod`) only exist after the system prepared the actor, so
 * all of them are optional.
 */

import type { Pf1AbilityKey, Pf1SaveKey } from '@/systems/pf1/shared/domain';

/** `ActorRollOptions` of pf1 11.x, forwarded to `pf1.dice.d20Roll`. */
export interface FoundryPf1RollOptions {
  skipDialog?: boolean;
  /** false: answer the message data instead of creating the ChatMessage. */
  chatMessage?: boolean;
  bonus?: string;
  dc?: number;
  /** Take 10 / Take 20. */
  staticRoll?: number;
  rollMode?: string;
}

/** A serialized `Roll` term (`term.toJSON()`): dice carry `faces` and `results`, numbers carry `number`. */
export interface FoundryRollTermData {
  class?: string;
  faces?: number;
  number?: number;
  results?: { result: number; active?: boolean; discarded?: boolean }[];
  /** FunctionTerm (`sizeRoll(…)`) and PoolTerm arguments. */
  rolls?: FoundryRollData[];
  /** ParentheticalTerm. */
  roll?: FoundryRollData;
}

/** A serialized `Roll` (`roll.toJSON()`, or the JSON string a ChatMessage stores). */
export interface FoundryRollData {
  class?: string;
  formula?: string;
  total?: number;
  terms?: FoundryRollTermData[];
  options?: {
    dc?: number;
    critical?: number;
    staticRoll?: number;
    /** `DamageRoll`: damage type ids, e.g. `['slashing']`. */
    damageType?: string[];
    /** `DamageRoll`: `normal`, `crit` or `nonCrit`. */
    type?: string;
  };
}

/** A live `Roll` instance, or its serialized form. */
export type FoundryRollLike = { toJSON(): FoundryRollData } | FoundryRollData | string;

/**
 * What `pf1.dice.d20Roll` answers: the created ChatMessage (live `Roll`
 * instances in `rolls`) or, with `chatMessage: false`, the message's
 * `toObject()` data (rolls as JSON strings). `undefined` when a hook or the
 * permission check cancelled the roll.
 */
export interface FoundryPf1RollResult {
  id?: string | null;
  rolls?: FoundryRollLike[];
}

export interface FoundryPf1AbilityData {
  value?: number;
  total?: number;
  mod?: number;
  damage?: number;
  drain?: number;
  userPenalty?: number;
}

export interface FoundryPf1SkillData {
  name?: string;
  ability?: string;
  rank?: number;
  mod?: number;
  /** Requires training. */
  rt?: boolean;
  /** Class skill. */
  cs?: boolean;
  /** Armor check penalty applies. */
  acp?: boolean;
  /** Craft, Perform, Profession and custom children: `crf.alchemy`, `prf.prf1`. */
  subSkills?: Record<string, FoundryPf1SkillData>;
}

export interface FoundryPf1SpellbookData {
  inUse?: boolean;
  /** User-set name, usually blank. */
  name?: string;
  /** Derived display name (the class name, e.g. `Cleric`). */
  label?: string;
  class?: string;
  ability?: string;
  cl?: { total?: number };
  concentration?: { total?: number };
}

export interface FoundryPf1HealthData {
  value?: number;
  max?: number;
  temp?: number;
  nonlethal?: number;
}

export interface FoundryPf1ActorSystem {
  abilities?: Partial<Record<Pf1AbilityKey, FoundryPf1AbilityData>>;
  attributes?: {
    hp?: FoundryPf1HealthData;
    /** Wounds & Vigor variant rule. */
    vigor?: FoundryPf1HealthData;
    wounds?: { value?: number; max?: number };
    ac?: {
      normal?: { total?: number };
      touch?: { total?: number };
      flatFooted?: { total?: number };
    };
    cmd?: { total?: number; flatFootedTotal?: number };
    cmb?: { total?: number };
    bab?: { total?: number };
    init?: { total?: number };
    sr?: { total?: number };
    savingThrows?: Partial<Record<Pf1SaveKey, { total?: number }>>;
    speed?: Record<string, { total?: number }>;
    spells?: { spellbooks?: Record<string, FoundryPf1SpellbookData> };
  };
  details?: {
    level?: { value?: number };
    cr?: { total?: number };
    alignment?: string;
    xp?: { value?: number };
  };
  skills?: Record<string, FoundryPf1SkillData>;
  /** Traps keep their CR here instead of under `details`. */
  cr?: { total?: number };
}

/** `actor.getSkillInfo(id)`: throws for an unknown id. */
export interface FoundryPf1SkillInfo {
  id?: string;
  name?: string;
  fullName?: string;
}

/** One `ItemAction` as stored in `item.system.actions`. */
export interface FoundryPf1ActionData {
  _id?: string;
  name?: string;
}

export interface FoundryPf1ItemSystem {
  /** Class level, spell level, buff level. */
  level?: number;
  spellbook?: string;
  active?: boolean;
  disabled?: boolean;
  quantity?: number;
  uses?: { value?: number; max?: number; per?: string };
  preparation?: { value?: number; max?: number };
  actions?: FoundryPf1ActionData[];
  subType?: string;
}

/** `UseOptions` of pf1 11.x (`ItemPF#use({ options })`). */
export interface FoundryPf1UseOptions {
  primaryAttack?: boolean;
  clCheck?: boolean;
  measureTemplate?: boolean;
  powerAttack?: boolean;
  abilityMult?: number;
  ammo?: string;
  haste?: boolean;
  manyshot?: boolean;
  rapidShot?: boolean;
  pointBlankShot?: boolean;
  flanking?: boolean;
  highGround?: boolean;
  charge?: boolean;
}

export interface FoundryPf1ItemUseParams {
  actionId?: string;
  cost?: number | null;
  skipDialog?: boolean;
  chatMessage?: boolean;
  rollMode?: string;
  options?: FoundryPf1UseOptions;
}

/** `AttackDamage` of a `ChatAttack`. */
export interface FoundryPf1AttackDamage {
  total?: number;
  rolls: FoundryRollLike[];
}

/** One `ChatAttack` of an action use: the attack, its crit confirmation and the damage rolls. */
export interface FoundryPf1ChatAttack {
  label?: string | null;
  attack: FoundryRollLike | null;
  critConfirm: FoundryRollLike | null;
  hasCritConfirm?: boolean;
  damage: FoundryPf1AttackDamage;
  critDamage: FoundryPf1AttackDamage;
  nonlethal?: boolean;
  ammo?: { id?: string; name?: string; misfire?: boolean } | null;
}

/** `SharedActionData` as the gateways read it back. */
export interface FoundryPf1SharedActionData {
  chatAttacks?: FoundryPf1ChatAttack[];
  saveDC?: number;
  save?: string;
  message?: FoundryPf1RollResult | null;
  reject?: boolean;
  scriptData?: { reject?: boolean; hideChat?: boolean };
  action?: { id?: string; name?: string } | null;
}

/**
 * `ItemPF#use` answers an `ActionUse` (with `shared`), `{ err, code }` when a
 * requirement failed, the shared data itself for an item without actions, or
 * nothing when it was cancelled.
 */
export type FoundryPf1ItemUseResult =
  | { shared: FoundryPf1SharedActionData }
  | { err: unknown; code: number }
  | FoundryPf1SharedActionData
  | null
  | undefined;

export interface FoundryPf1Item {
  id: string;
  name: string;
  type: string;
  system: FoundryPf1ItemSystem;
  use(params?: FoundryPf1ItemUseParams): Promise<FoundryPf1ItemUseResult>;
}

export interface FoundryPf1ItemsCollection {
  contents: FoundryPf1Item[];
  get(id: string): FoundryPf1Item | undefined;
}

/** `ApplyDamageOptions` of `ActorPF#applyDamage`. */
export interface FoundryPf1ApplyDamageOptions {
  asNonlethal?: boolean;
  asWounds?: boolean;
}

export interface FoundryPf1Actor {
  id: string;
  /** Differs from the world actor's for an unlinked token's synthetic actor. */
  uuid?: string;
  name: string;
  type: string;
  system: FoundryPf1ActorSystem;
  items: FoundryPf1ItemsCollection;
  statuses: Set<string>;
  getSkillInfo(skillId: string): FoundryPf1SkillInfo;
  rollAbilityTest(abilityId: string, options?: FoundryPf1RollOptions): Promise<FoundryPf1RollResult | undefined>;
  rollSkill(skillId: string, options?: FoundryPf1RollOptions): Promise<FoundryPf1RollResult | undefined>;
  rollSavingThrow(saveId: string, options?: FoundryPf1RollOptions): Promise<FoundryPf1RollResult | undefined>;
  rollCL(bookId: string, options?: FoundryPf1RollOptions): Promise<FoundryPf1RollResult | undefined>;
  rollConcentration(bookId: string, options?: FoundryPf1RollOptions): Promise<FoundryPf1RollResult | undefined>;
  /** Positive damages, negative heals; answers `false` for 0 or without permission. */
  applyDamage(value: number, options?: FoundryPf1ApplyDamageOptions): Promise<unknown>;
  /** Condition id → state of the updates actually made (immune or unchanged ids are dropped). */
  setConditions(conditions: Record<string, boolean>): Promise<Record<string, boolean>>;
}

export interface FoundryPf1Token {
  id: string;
  name: string;
  actor: FoundryPf1Actor | null;
}

export interface FoundryPf1Scene {
  id: string;
  tokens: { get(id: string): FoundryPf1Token | undefined };
}

/** An entry of `pf1.registry.conditions` (a Foundry `Collection` of condition models). */
export interface FoundryPf1Condition {
  id?: string;
  _id?: string;
  name?: string;
  /** Mutually exclusive groups: `fear`, `lethargy`, `dying`. */
  track?: string | null;
}

export interface FoundryPf1Registry {
  conditions: {
    get(id: string): FoundryPf1Condition | undefined;
    contents?: FoundryPf1Condition[];
  };
}

/** The `pf1.healthConfig` setting (`HealthConfigModel`): which health rules each actor type uses. */
export interface FoundryPf1HealthConfig {
  getActorConfig(actor: FoundryPf1Actor): { rules?: { useWoundsAndVigor?: boolean } } | undefined;
}

export interface FoundryPf1Game {
  actors: { get(id: string): FoundryPf1Actor | undefined };
  settings?: { get(scope: string, key: string): unknown };
  scenes: {
    get(id: string): FoundryPf1Scene | undefined;
    active: FoundryPf1Scene | null;
  };
}

export function getPf1Game(): FoundryPf1Game {
  return (globalThis as unknown as { game: FoundryPf1Game }).game;
}

/** The system's `pf1` global (`pf1.registry`); absent under Jest unless a test installs it. */
export function getPf1Registry(): FoundryPf1Registry | undefined {
  return (globalThis as unknown as { pf1?: { registry?: FoundryPf1Registry } }).pf1?.registry;
}
