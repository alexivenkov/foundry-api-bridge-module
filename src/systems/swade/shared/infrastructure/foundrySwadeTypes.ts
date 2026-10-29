/**
 * Minimal anti-corruption view of the SWADE system API (swade 6.0.4, Foundry
 * v14). Only the members the swade/* gateways touch are modelled here; every
 * field was checked against the installed system's TypeScript sources.
 */

import type { SwadeAttributeKey } from '@/systems/swade/shared/domain';

export interface FoundrySwadeTraitDie {
  sides: number;
  modifier: number;
}

export interface FoundrySwadeAttribute {
  die: FoundrySwadeTraitDie;
  'wild-die': { sides: number };
  /** Vigor only. */
  soakBonus?: number;
  /** Spirit only. */
  unShakeBonus?: number;
  /** Vehicles only: the attribute is in play when true. */
  enabled?: boolean;
}

export interface FoundrySwadeRollModifier {
  label: string;
  value: number | string;
  ignore?: boolean;
}

/** `IRollOptions` of swade 6.0.4 as consumed by `rollAttribute` / `rollSkill` / `rollDamage`. */
export interface FoundrySwadeRollOptions {
  suppressChat?: boolean;
  isRerollable?: boolean;
  ignoreWounds?: boolean;
  additionalMods?: FoundrySwadeRollModifier[];
  item?: FoundrySwadeItem;
  ap?: number;
  isHeavyWeapon?: boolean;
  dmgOverride?: string;
  rof?: number;
  flavour?: string;
  title?: string;
}

export interface FoundryDieResult {
  result: number;
  active?: boolean;
  exploded?: boolean;
  discarded?: boolean;
}

/** A Foundry `Die` term (`WildDie extends Die`). */
export interface FoundryDieTerm {
  faces?: number;
  number?: number;
  results: FoundryDieResult[];
  total?: number;
  flavor?: string;
  denomination?: string;
}

/** Any term of a roll: operator, numeric, die or pool; only common fields are typed. */
export interface FoundryRollTerm {
  operator?: string;
  total?: number;
  flavor?: string;
  expression?: string;
  faces?: number;
  results?: FoundryDieResult[];
  rolls?: FoundryPoolRoll[];
}

export interface FoundryPoolRoll {
  total?: number;
  dice: FoundryDieTerm[];
}

export interface FoundryPoolResult {
  result: number;
  active?: boolean;
  discarded?: boolean;
}

/** The `PoolTerm` at the head of a trait roll: one roll per die, `kh` keeps the best. */
export interface FoundryPoolTerm extends FoundryRollTerm {
  rolls: FoundryPoolRoll[];
  results: FoundryPoolResult[];
}

export interface FoundryChatMessageLike {
  id?: string | null;
}

export interface FoundrySwadeRollBase {
  terms: FoundryRollTerm[];
  dice: FoundryDieTerm[];
  formula: string;
  total?: number;
  evaluate(options?: { allowInteractive?: boolean }): Promise<unknown>;
  toMessage(
    messageData?: Record<string, unknown>,
    options?: { messageMode?: string }
  ): Promise<FoundryChatMessageLike | null | undefined>;
}

/** swade `TraitRoll`: `targetNumber` (default 4), `successes` and `isCritfail` after evaluation. */
export interface FoundrySwadeTraitRoll extends FoundrySwadeRollBase {
  targetNumber: number;
  readonly successes: number;
  readonly isCritfail?: boolean;
}

/** swade `DamageRoll`; `ap`/`isHeavyWeapon` are lost on the `suppressChat` path, so the gateway computes them. */
export type FoundrySwadeDamageRoll = FoundrySwadeRollBase;

export interface FoundrySwadeSkillSystem {
  die: FoundrySwadeTraitDie;
  'wild-die': { sides: number };
  attribute: string;
  swid?: string;
}

export interface FoundrySwadeWeaponSystem {
  damage: string;
  ap: number;
  rof: number;
  range: string;
  parry: number;
  minStr: string;
  shots: number;
  currentShots: number;
  isHeavyWeapon: boolean;
  equipStatus: number;
  actions: { trait: string; traitMod: string; dmgMod: string };
  /** Raise damage: `bonusDamageDice` dice of `bonusDamageDie` sides (defaults 1 and 6). */
  bonusDamageDice: number;
  bonusDamageDie: number;
  isMelee: boolean;
  isRanged: boolean;
}

export interface FoundrySwadePowerSystem {
  pp: number;
  arcane: string;
  rank: string;
  range: string;
  duration: string;
  damage: string;
}

export interface FoundrySwadeItem {
  id: string;
  name: string;
  type: string;
  system: Partial<FoundrySwadeSkillSystem & FoundrySwadeWeaponSystem & FoundrySwadePowerSystem>;
  rollDamage(options?: FoundrySwadeRollOptions): Promise<FoundrySwadeDamageRoll | null>;
}

export interface FoundrySwadeItemsCollection {
  contents: FoundrySwadeItem[];
  get(id: string): FoundrySwadeItem | undefined;
}

export interface FoundrySwadeDerivedModifier {
  label: string;
  value: number | string;
}

export interface FoundrySwadeCreatureStats {
  toughness: { value: number; armor: number };
  parry: { value: number };
  size: number;
  globalMods?: { ap?: FoundrySwadeDerivedModifier[] };
}

export interface FoundrySwadeVehicleStats {
  parry: { value: number };
}

export interface FoundrySwadeActorSystem {
  wildcard?: boolean;
  attributes?: Partial<Record<SwadeAttributeKey, FoundrySwadeAttribute>>;
  stats?: Partial<FoundrySwadeCreatureStats & FoundrySwadeVehicleStats>;
  wounds?: { value: number; max: number; ignored?: number };
  fatigue?: { value: number; max: number; ignored?: number };
  bennies?: { value: number; max: number };
  powerPoints?: Record<string, { value: number; max: number }>;
  pace?: { base?: string; default?: number; running?: { die: number; mod?: number } };
  details?: { conviction?: { value: number; active: boolean } };
  advances?: { rank?: string };
  initiative?: { hasHesitant?: boolean; hasLevelHeaded?: boolean; hasImpLevelHeaded?: boolean; hasQuick?: boolean };
  /** Vehicles. */
  toughness?: { total: number; armor: number };
  handling?: number;
  topspeed?: { value: number; unit: string };
  status?: { isOutOfControl?: boolean; isWrecked?: boolean; isDistracted?: boolean; isVulnerable?: boolean };
  refreshBennies?: (notify?: boolean) => Promise<void>;
}

export type FoundrySwadeActorType = 'character' | 'npc' | 'vehicle' | 'group';

export interface FoundrySwadeActor {
  id: string;
  name: string;
  type: string;
  system: FoundrySwadeActorSystem;
  items: FoundrySwadeItemsCollection;
  statuses: Set<string>;
  readonly isWildcard: boolean;
  readonly bennies: number;
  readonly isUnarmored?: boolean;
  rollAttribute(attribute: SwadeAttributeKey, options?: FoundrySwadeRollOptions): Promise<FoundrySwadeTraitRoll | null>;
  rollSkill(skillId: string | null, options?: FoundrySwadeRollOptions): Promise<FoundrySwadeTraitRoll | null>;
  makeUnskilledAttempt(options?: FoundrySwadeRollOptions): Promise<FoundrySwadeTraitRoll | null>;
  toggleActiveEffect(statusId: string, options?: { active?: boolean; overlay?: boolean }): Promise<boolean>;
  spendBenny(): Promise<boolean>;
  getBenny(): Promise<void>;
  refreshBennies(notify?: boolean): Promise<void>;
  calcWoundPenalties(): number;
  calcFatiguePenalties(): number;
  getFlag(scope: string, key: string): unknown;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundrySwadeToken {
  id: string;
  name: string;
  actor: FoundrySwadeActor | null;
}

export interface FoundrySwadeScene {
  id: string;
  tokens: { get(id: string): FoundrySwadeToken | undefined };
}

export interface FoundrySwadeUser {
  isGM: boolean;
  readonly bennies: number;
  spendBenny(): Promise<boolean | undefined>;
  getBenny(): Promise<void>;
  refreshBennies(notify?: boolean): Promise<void>;
}

export interface FoundrySwadeCombatant {
  id: string;
  name: string;
  actorId: string | null;
  tokenId: string | null;
  initiative: number | null;
  defeated?: boolean;
  readonly isDefeated?: boolean;
  readonly isGroupLeader?: boolean;
  readonly roundHeld?: number | null;
  readonly turnLost?: boolean;
  system: {
    cardValue?: number | null;
    suitValue?: number | null;
    cardString?: string | null;
    hasJoker?: boolean;
    roundHeld?: number | null;
    turnLost?: boolean;
  };
}

export interface FoundrySwadeCombat {
  id: string;
  round: number;
  turn: number | null;
  combatants: { contents: FoundrySwadeCombatant[] };
}

export interface FoundrySwadeGame {
  actors: { get(id: string): FoundrySwadeActor | undefined };
  scenes: {
    get(id: string): FoundrySwadeScene | undefined;
    active: FoundrySwadeScene | null;
  };
  user?: FoundrySwadeUser | null;
  combat?: FoundrySwadeCombat | null;
  combats?: {
    get(id: string): FoundrySwadeCombat | undefined;
    active?: FoundrySwadeCombat | null;
  };
  settings?: { get(scope: string, key: string): unknown };
  swade?: { dice?: { WildDie?: unknown } };
  i18n?: { localize(key: string): string };
}

export function getSwadeGame(): FoundrySwadeGame {
  return (globalThis as unknown as { game: FoundrySwadeGame }).game;
}

export function isPoolTerm(term: FoundryRollTerm | undefined): term is FoundryPoolTerm {
  return term !== undefined && Array.isArray(term.rolls) && Array.isArray(term.results);
}
