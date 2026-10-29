import type {
  FoundryDieTerm,
  FoundryPoolTerm,
  FoundryRollTerm,
  FoundrySwadeActor,
  FoundrySwadeActorSystem,
  FoundrySwadeCombat,
  FoundrySwadeCombatant,
  FoundrySwadeDamageRoll,
  FoundrySwadeGame,
  FoundrySwadeItem,
  FoundrySwadeScene,
  FoundrySwadeToken,
  FoundrySwadeTraitRoll,
  FoundrySwadeUser
} from '@/systems/swade/shared/infrastructure';

export interface FakeDieSpec {
  faces: number;
  results: number[];
  wild?: boolean;
}

export interface FakeTraitRollSpec {
  dice?: FakeDieSpec[];
  keptIndex?: number;
  modifiers?: [string, number][];
  targetNumber?: number;
  successes?: number;
  isCritfail?: boolean;
  messageId?: string;
}

export interface FakeTraitRoll extends FoundrySwadeTraitRoll {
  evaluate: jest.Mock;
  toMessage: jest.Mock;
}

function dieTerm(spec: FakeDieSpec): FoundryDieTerm {
  const total = spec.results.reduce((sum, r) => sum + r, 0);
  return {
    faces: spec.faces,
    number: 1,
    results: spec.results.map((result) => ({ result, active: true })),
    total,
    flavor: spec.wild ? 'Wild Die' : 'Trait',
    denomination: spec.wild ? `dw${String(spec.faces)}` : `d${String(spec.faces)}`
  };
}

/** A fake swade `TraitRoll`: a `kh` pool of dice followed by `+n[label]` modifier terms, with the system's `successes` rule. */
export function makeTraitRoll(spec: FakeTraitRollSpec = {}): FakeTraitRoll {
  const diceSpecs = spec.dice ?? [
    { faces: 8, results: [5] },
    { faces: 6, results: [3], wild: true }
  ];
  const poolRolls = diceSpecs.map((d) => {
    const die = dieTerm(d);
    return { total: die.total ?? 0, dice: [die] };
  });
  const keptIndex =
    spec.keptIndex ?? poolRolls.reduce((best, roll, i, all) => (roll.total > (all[best]?.total ?? -1) ? i : best), 0);
  const pool: FoundryPoolTerm = {
    rolls: poolRolls,
    results: poolRolls.map((roll, i) => ({ result: roll.total, active: i === keptIndex, discarded: i !== keptIndex }))
  };
  const terms: FoundryRollTerm[] = [pool];
  const modifiers = spec.modifiers ?? [];
  for (const [label, value] of modifiers) {
    terms.push({ operator: value < 0 ? '-' : '+' });
    terms.push({ total: Math.abs(value), flavor: label, expression: String(Math.abs(value)) });
  }
  const total = (poolRolls[keptIndex]?.total ?? 0) + modifiers.reduce((sum, [, value]) => sum + value, 0);

  const roll = {
    terms,
    dice: poolRolls.flatMap((r) => r.dice),
    formula: `{${diceSpecs.map((d) => `1d${String(d.faces)}x`).join(', ')}}kh`,
    total,
    targetNumber: spec.targetNumber ?? 4,
    isCritfail: spec.isCritfail ?? false,
    get successes(): number {
      if (spec.successes !== undefined) return spec.successes;
      if (this.isCritfail) return -1;
      if (this.total < this.targetNumber) return 0;
      if (this.total < this.targetNumber + 4) return 1;
      return Math.floor((this.total - this.targetNumber) / 4) + 1;
    },
    evaluate: jest.fn().mockResolvedValue(undefined),
    toMessage: jest.fn().mockResolvedValue({ id: spec.messageId ?? 'msg-1' })
  };
  return roll as unknown as FakeTraitRoll;
}

export interface FakeDamageRoll extends FoundrySwadeDamageRoll {
  evaluate: jest.Mock;
  toMessage: jest.Mock;
}

export function makeDamageRoll(spec: { dice?: FakeDieSpec[]; total?: number; formula?: string; messageId?: string } = {}): FakeDamageRoll {
  const dice = (spec.dice ?? [{ faces: 8, results: [6] }, { faces: 6, results: [4] }]).map(dieTerm);
  const total = spec.total ?? dice.reduce((sum, die) => sum + (die.total ?? 0), 0);
  const roll = {
    terms: dice.map((die) => ({ faces: die.faces, total: die.total, results: die.results, flavor: die.flavor })),
    dice,
    formula: spec.formula ?? '1d8x + 1d6x',
    total,
    evaluate: jest.fn().mockResolvedValue(undefined),
    toMessage: jest.fn().mockResolvedValue({ id: spec.messageId ?? 'dmg-1' })
  };
  return roll as unknown as FakeDamageRoll;
}

export interface FakeItem extends FoundrySwadeItem {
  rollDamage: jest.Mock;
}

export function makeWeapon(overrides: Partial<FoundrySwadeItem> & { damageRoll?: FakeDamageRoll | null } = {}): FakeItem {
  const { damageRoll, system, ...rest } = overrides;
  const item = {
    id: 'w1',
    name: 'Longsword',
    type: 'weapon',
    system: {
      damage: '@str+d8',
      ap: 0,
      rof: 1,
      range: '',
      parry: 1,
      minStr: 'd8',
      shots: 0,
      currentShots: 0,
      isHeavyWeapon: false,
      equipStatus: 4,
      actions: { trait: 'Fighting', traitMod: '', dmgMod: '' },
      bonusDamageDice: 1,
      bonusDamageDie: 6,
      isMelee: true,
      isRanged: false,
      ...system
    },
    rollDamage: jest.fn().mockResolvedValue(damageRoll === undefined ? makeDamageRoll() : damageRoll),
    ...rest
  };
  return item as unknown as FakeItem;
}

export function makeSkill(overrides: Partial<FoundrySwadeItem> = {}): FakeItem {
  const { system, ...rest } = overrides;
  const item = {
    id: 's1',
    name: 'Fighting',
    type: 'skill',
    system: { die: { sides: 8, modifier: 0 }, 'wild-die': { sides: 6 }, attribute: 'agility', swid: 'fighting', ...system },
    rollDamage: jest.fn().mockResolvedValue(null),
    ...rest
  };
  return item as unknown as FakeItem;
}

export function makePower(overrides: Partial<FoundrySwadeItem> = {}): FakeItem {
  const { system, ...rest } = overrides;
  const item = {
    id: 'p1',
    name: 'Bolt',
    type: 'power',
    system: { pp: 1, arcane: 'general', rank: 'Novice', range: '12', duration: 'Instant', damage: '2d6', ...system },
    rollDamage: jest.fn().mockResolvedValue(null),
    ...rest
  };
  return item as unknown as FakeItem;
}

export interface FakeActorOptions {
  id?: string;
  name?: string;
  type?: 'character' | 'npc' | 'vehicle' | 'group';
  wildcard?: boolean;
  system?: Partial<FoundrySwadeActorSystem>;
  items?: FoundrySwadeItem[];
  statuses?: string[];
  flags?: Record<string, unknown>;
  roll?: FoundrySwadeTraitRoll | null;
  isUnarmored?: boolean;
}

export interface FakeActor extends FoundrySwadeActor {
  rollAttribute: jest.Mock;
  rollSkill: jest.Mock;
  makeUnskilledAttempt: jest.Mock;
  toggleActiveEffect: jest.Mock;
  spendBenny: jest.Mock;
  getBenny: jest.Mock;
  refreshBennies: jest.Mock;
  update: jest.Mock;
  calcWoundPenalties: jest.Mock;
  calcFatiguePenalties: jest.Mock;
  getFlag: jest.Mock;
}

function creatureSystem(wildcard: boolean): FoundrySwadeActorSystem {
  const trait = (sides: number): { die: { sides: number; modifier: number }; 'wild-die': { sides: number } } => ({
    die: { sides, modifier: 0 },
    'wild-die': { sides: 6 }
  });
  return {
    wildcard,
    attributes: {
      agility: trait(8),
      smarts: trait(6),
      spirit: { ...trait(6), unShakeBonus: 0 },
      strength: trait(8),
      vigor: { ...trait(8), soakBonus: 0 }
    },
    stats: { toughness: { value: 7, armor: 2 }, parry: { value: 6 }, size: 0, globalMods: { ap: [] } },
    wounds: { value: 0, max: 3, ignored: 0 },
    fatigue: { value: 0, max: 2, ignored: 0 },
    bennies: { value: 3, max: 3 },
    powerPoints: { general: { value: 10, max: 15 } },
    pace: { base: 'ground', default: 6, running: { die: 6, mod: 0 } },
    details: { conviction: { value: 0, active: false } },
    advances: { rank: 'Seasoned' },
    initiative: { hasHesitant: false, hasLevelHeaded: true, hasImpLevelHeaded: false, hasQuick: false }
  };
}

function vehicleSystem(): FoundrySwadeActorSystem {
  return {
    toughness: { total: 12, armor: 4 },
    wounds: { value: 0, max: 3, ignored: 0 },
    stats: { parry: { value: 2 } },
    handling: -1,
    topspeed: { value: 60, unit: 'mph' },
    status: { isOutOfControl: false, isWrecked: false, isDistracted: false, isVulnerable: false },
    initiative: { hasHesitant: false, hasLevelHeaded: false, hasImpLevelHeaded: false, hasQuick: false },
    attributes: {
      agility: { die: { sides: 6, modifier: 0 }, 'wild-die': { sides: 6 }, enabled: false },
      smarts: { die: { sides: 6, modifier: 0 }, 'wild-die': { sides: 6 }, enabled: false },
      spirit: { die: { sides: 6, modifier: 0 }, 'wild-die': { sides: 6 }, enabled: false },
      strength: { die: { sides: 6, modifier: 0 }, 'wild-die': { sides: 6 }, enabled: false },
      vigor: { die: { sides: 6, modifier: 0 }, 'wild-die': { sides: 6 }, enabled: false }
    }
  };
}

/** A fake SWADE actor whose system methods behave like swade 6.0.4 on the data they touch. */
export function makeActor(options: FakeActorOptions = {}): FakeActor {
  const type = options.type ?? 'character';
  const wildcard = options.wildcard ?? type === 'character';
  const base = type === 'vehicle' ? vehicleSystem() : type === 'group' ? {} : creatureSystem(wildcard);
  const system: FoundrySwadeActorSystem = { ...base, ...options.system };
  const statuses = new Set<string>(options.statuses ?? []);
  const items = options.items ?? [];
  const flags = options.flags ?? {};
  const roll = options.roll === undefined ? makeTraitRoll() : options.roll;

  const actor = {
    id: options.id ?? 'a1',
    name: options.name ?? 'Hero',
    type,
    system,
    items: { contents: items, get: (id: string): FoundrySwadeItem | undefined => items.find((item) => item.id === id) },
    statuses,
    get isWildcard(): boolean {
      return type === 'character' ? true : type === 'vehicle' || type === 'group' ? false : system.wildcard === true;
    },
    get bennies(): number {
      return system.bennies?.value ?? 0;
    },
    isUnarmored: options.isUnarmored ?? false,
    rollAttribute: jest.fn().mockResolvedValue(roll),
    rollSkill: jest.fn().mockResolvedValue(roll),
    makeUnskilledAttempt: jest.fn().mockResolvedValue(roll),
    toggleActiveEffect: jest.fn(async (id: string, opts: { active?: boolean } = {}) => {
      const state = opts.active ?? !statuses.has(id);
      if (state) statuses.add(id);
      else statuses.delete(id);
      return Promise.resolve(state);
    }),
    spendBenny: jest.fn(async () => {
      if (!system.bennies || system.bennies.value < 1) return Promise.resolve(false);
      system.bennies.value -= 1;
      return Promise.resolve(true);
    }),
    getBenny: jest.fn(async () => {
      if (system.bennies) system.bennies.value += 1;
      return Promise.resolve();
    }),
    refreshBennies: jest.fn(async () => {
      if (system.bennies) system.bennies.value = system.bennies.max;
      return Promise.resolve();
    }),
    update: jest.fn(async (data: Record<string, unknown>) => {
      const wounds = data['system.wounds.value'];
      if (typeof wounds === 'number' && system.wounds) system.wounds.value = wounds;
      const bennies = data['system.bennies.value'];
      if (typeof bennies === 'number' && system.bennies) system.bennies.value = bennies;
      return Promise.resolve(undefined);
    }),
    calcWoundPenalties: jest.fn(() => -Math.min(3, Math.max(0, (system.wounds?.value ?? 0) - (system.wounds?.ignored ?? 0)))),
    calcFatiguePenalties: jest.fn(() => -Math.max(0, (system.fatigue?.value ?? 0) - (system.fatigue?.ignored ?? 0))),
    getFlag: jest.fn((_scope: string, key: string) => flags[key])
  };
  return actor as unknown as FakeActor;
}

export interface FakeUser extends FoundrySwadeUser {
  spendBenny: jest.Mock;
  getBenny: jest.Mock;
  refreshBennies: jest.Mock;
}

export function makeUser(options: { isGM?: boolean; bennies?: number; refreshTo?: number } = {}): FakeUser {
  const state = { bennies: options.bennies ?? 2 };
  const user = {
    isGM: options.isGM ?? true,
    get bennies(): number {
      return state.bennies;
    },
    spendBenny: jest.fn(async () => {
      if (state.bennies <= 0) return Promise.resolve(false);
      state.bennies -= 1;
      return Promise.resolve(true);
    }),
    getBenny: jest.fn(async () => {
      state.bennies += 1;
      return Promise.resolve();
    }),
    refreshBennies: jest.fn(async () => {
      state.bennies = options.refreshTo ?? 4;
      return Promise.resolve();
    })
  };
  return user as unknown as FakeUser;
}

export function makeCombatant(overrides: Partial<FoundrySwadeCombatant> = {}): FoundrySwadeCombatant {
  return {
    id: 'c1',
    name: 'Hero',
    actorId: 'a1',
    tokenId: 't1',
    initiative: 12.4,
    defeated: false,
    isGroupLeader: false,
    roundHeld: null,
    turnLost: false,
    system: { cardValue: 12, suitValue: 4, cardString: 'Queen of Spades', hasJoker: false },
    ...overrides
  };
}

export function makeCombat(overrides: Partial<FoundrySwadeCombat> = {}): FoundrySwadeCombat {
  return {
    id: 'combat-1',
    round: 2,
    turn: 0,
    combatants: { contents: [makeCombatant()] },
    ...overrides
  };
}

export interface FakeGameOptions {
  actors?: FoundrySwadeActor[];
  tokens?: FoundrySwadeToken[];
  sceneId?: string;
  noActiveScene?: boolean;
  settings?: Record<string, unknown>;
  user?: FoundrySwadeUser | null;
  combat?: FoundrySwadeCombat | null;
  combats?: FoundrySwadeCombat[];
  wildDieClass?: unknown;
}

/** A fake Foundry `game` with world actors, one scene of tokens, settings, the user and combats. */
export function makeGame(options: FakeGameOptions = {}): FoundrySwadeGame {
  const actors = options.actors ?? [];
  const tokens = options.tokens ?? [];
  const sceneId = options.sceneId ?? 's1';
  const scene: FoundrySwadeScene = { id: sceneId, tokens: { get: (id) => tokens.find((token) => token.id === id) } };
  const settings = options.settings ?? {};
  const combats = options.combats ?? (options.combat ? [options.combat] : []);
  return {
    actors: { get: (id) => actors.find((actor) => actor.id === id) },
    scenes: {
      get: (id) => (id === sceneId ? scene : undefined),
      active: options.noActiveScene ? null : scene
    },
    user: options.user ?? null,
    combat: options.combat ?? null,
    combats: { get: (id) => combats.find((combat) => combat.id === id), active: options.combat ?? null },
    settings: { get: (_scope, key) => settings[key] },
    swade: { dice: { WildDie: options.wildDieClass } }
  };
}
