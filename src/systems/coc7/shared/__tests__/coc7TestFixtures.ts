import type { Coc7DieRollOutcome } from '@/systems/coc7/shared/domain';
import type {
  Coc7D10Roll,
  Coc7DiceRoller,
  Coc7FormulaRoll,
  FoundryCoc7Actor,
  FoundryCoc7ActorSystem,
  FoundryCoc7BoutResult,
  FoundryCoc7Conditions,
  FoundryCoc7Game,
  FoundryCoc7Item,
  FoundryCoc7SanityLossEvent,
  FoundryCoc7Scene,
  FoundryCoc7Token,
  FoundryCoc7User,
  FoundryRollLike
} from '@/systems/coc7/shared/infrastructure';

export interface FakeRoll extends FoundryRollLike {
  evaluate: jest.Mock;
  toMessage: jest.Mock;
}

export function makeFakeRoll(formula: string, results: number[], total: number, faces = 10): FakeRoll {
  const roll = {
    formula,
    total,
    dice: [{ faces, number: results.length, results: results.map((result) => ({ result, active: true })), total }],
    evaluate: jest.fn().mockResolvedValue(undefined),
    toMessage: jest.fn().mockResolvedValue({ id: 'roll-msg-1' })
  };
  return roll as unknown as FakeRoll;
}

/** `1d6+2` → 8, `2d6` → 12, `3` → 3: the maximum of a simple formula, enough for the fixtures. */
export function maxOf(formula: string): number {
  let total = 0;
  for (const match of String(formula).replace(/\s+/g, '').matchAll(/([+-]?)(\d+)(?:[dD](\d+))?/g)) {
    const sign = match[1] === '-' ? -1 : 1;
    const count = Number(match[2]);
    const faces = match[3] !== undefined ? Number(match[3]) : 1;
    total += sign * count * faces;
  }
  return total;
}

/** A dice roller fed with queued d10 faces and a table of formula totals. */
export class FakeDiceRoller implements Coc7DiceRoller {
  readonly d10Queue: number[][] = [];
  readonly formulaTotals: Record<string, number> = {};
  readonly formulaCalls: { formula: string; data: Record<string, unknown>; maximize: boolean }[] = [];
  readonly d10Calls: number[] = [];

  queueD10(...faces: number[][]): this {
    this.d10Queue.push(...faces);
    return this;
  }

  /** Queue one full check: the tens faces then the unit face (10 = 0 / 00). */
  queueCheck(tens: number[], unit: number): this {
    this.d10Queue.push(tens, [unit]);
    return this;
  }

  async rollD10(count: number): Promise<Coc7D10Roll> {
    this.d10Calls.push(count);
    const results = this.d10Queue.shift() ?? Array.from({ length: count }, () => 5);
    return Promise.resolve({ results, roll: makeFakeRoll(`${String(count)}d10`, results, results.reduce((a, b) => a + b, 0)) });
  }

  async rollFormula(formula: string, data: Record<string, unknown> = {}, options: { maximize?: boolean } = {}): Promise<Coc7FormulaRoll> {
    const maximize = options.maximize === true;
    this.formulaCalls.push({ formula, data, maximize });
    const total = maximize ? maxOf(formula) : (this.formulaTotals[formula] ?? maxOf(formula));
    const dice: Coc7DieRollOutcome[] = [{ formula, results: [total], total }];
    return Promise.resolve({ formula, total, dice, roll: makeFakeRoll(formula, [total], total, 6) });
  }
}

export interface FakeItem extends FoundryCoc7Item {
  update: jest.Mock;
}

export interface FakeSkillOptions {
  id?: string;
  name?: string;
  skillName?: string;
  specialization?: string;
  value?: number;
  base?: string;
  cocid?: string;
  push?: boolean;
  noxpgain?: boolean;
  developement?: boolean;
  fighting?: boolean;
  firearm?: boolean;
  special?: boolean;
  rarity?: boolean;
}

export function makeSkill(options: FakeSkillOptions = {}): FakeItem {
  const name = options.name ?? 'Spot Hidden';
  const flags = { developement: options.developement ?? false };
  const item = {
    id: options.id ?? 'sk-spot',
    name,
    type: 'skill',
    system: {
      skillName: options.skillName ?? name,
      specialization: options.specialization ?? '',
      base: options.base ?? '25',
      value: options.value ?? 45,
      properties: {
        noxpgain: options.noxpgain ?? false,
        special: options.special ?? false,
        rarity: options.rarity ?? false,
        push: options.push ?? true,
        fighting: options.fighting ?? false,
        firearm: options.firearm ?? false,
        ranged: false,
        own: false
      },
      flags
    },
    flags: options.cocid !== undefined ? { CoC7: { cocidFlag: { id: options.cocid } } } : {},
    update: jest.fn(async (data: Record<string, unknown>) => {
      const tick = data['system.flags.developement'];
      if (typeof tick === 'boolean') {
        flags.developement = tick;
      }
      return Promise.resolve(undefined);
    })
  };
  return item as unknown as FakeItem;
}

export interface FakeWeaponOptions {
  id?: string;
  name?: string;
  skillMain?: FoundryCoc7Item | undefined;
  skillAlternative?: FoundryCoc7Item | undefined;
  damage?: string;
  longDamage?: string;
  extremeDamage?: string;
  range?: string;
  longRange?: string;
  extremeRange?: string;
  usesPerRound?: string;
  bullets?: number | null;
  ammo?: number;
  malfunction?: number | null;
  properties?: Record<string, boolean>;
}

export function makeWeapon(options: FakeWeaponOptions = {}): FakeItem {
  const main = options.skillMain;
  const alternative = options.skillAlternative;
  const item = {
    id: options.id ?? 'w-knife',
    name: options.name ?? 'Knife',
    type: 'weapon',
    system: {
      skill: {
        main: { id: main?.id ?? '', name: main?.name ?? '' },
        alternativ: { id: alternative?.id ?? '', name: alternative?.name ?? '' }
      },
      skillMain: main,
      skillAlternative: alternative ?? main,
      range: {
        normal: { value: options.range ?? '', damage: options.damage ?? '1d4' },
        long: { value: options.longRange ?? '', damage: options.longDamage ?? '' },
        extreme: { value: options.extremeRange ?? '', damage: options.extremeDamage ?? '' }
      },
      usesPerRound: { normal: options.usesPerRound ?? '1', max: null, burst: null },
      bullets: options.bullets ?? null,
      ammo: options.ammo ?? 0,
      malfunction: options.malfunction ?? null,
      properties: { rngd: false, impl: false, addb: false, ahdb: false, brst: false, auto: false, thrown: false, ...options.properties }
    },
    flags: {},
    update: jest.fn().mockResolvedValue(undefined)
  };
  return item as unknown as FakeItem;
}

export function makeStatus(options: { id?: string; name?: string; phobia?: boolean; mania?: boolean } = {}): FakeItem {
  const item = {
    id: options.id ?? 'st-1',
    name: options.name ?? 'Nyctophobia',
    type: 'status',
    system: { type: { phobia: options.phobia ?? true, mania: options.mania ?? false } },
    flags: {},
    update: jest.fn().mockResolvedValue(undefined)
  };
  return item as unknown as FakeItem;
}

export function makeSpell(options: { id?: string; name?: string; costs?: Partial<Record<'hitPoints' | 'magicPoints' | 'sanity' | 'power' | 'others', string>> } = {}): FakeItem {
  const item = {
    id: options.id ?? 'sp-1',
    name: options.name ?? 'Elder Sign',
    type: 'spell',
    system: { costs: { hitPoints: '0', magicPoints: '5', sanity: '1d4', power: '0', others: '', ...options.costs } },
    flags: {},
    update: jest.fn().mockResolvedValue(undefined)
  };
  return item as unknown as FakeItem;
}

export type FakeActorType = 'character' | 'npc' | 'creature' | 'vehicle' | 'container';

export interface FakeActorOptions {
  id?: string;
  name?: string;
  type?: FakeActorType;
  system?: Partial<FoundryCoc7ActorSystem>;
  items?: FoundryCoc7Item[];
  /** Status ids carried by active effects (one effect per entry). */
  effects?: string[];
  mythosHardened?: boolean;
  bout?: FoundryCoc7BoutResult;
}

export interface FakeActor extends FoundryCoc7Actor {
  update: jest.Mock;
  dealDamage: jest.Mock;
  setHp: jest.Mock;
  spendLuck: jest.Mock;
  setLuck: jest.Mock;
  conditionsSet: jest.Mock;
  conditionsUnset: jest.Mock;
  enterBoutOfMadness: jest.Mock;
  setReasonSanLoss: jest.Mock;
}

function emptyConditions(): FoundryCoc7Conditions {
  return {
    criticalWounds: { value: false },
    unconscious: { value: false },
    dying: { value: false },
    dead: { value: false },
    prone: { value: false },
    tempoInsane: { value: false, realTime: false, duration: 0 },
    indefInsane: { value: false }
  };
}

function creatureSystem(type: FakeActorType): FoundryCoc7ActorSystem {
  const characteristic = (value: number): { value: number; formula: string } => ({ value, formula: '' });
  const base: FoundryCoc7ActorSystem = {
    characteristics: {
      str: characteristic(50),
      con: characteristic(60),
      siz: characteristic(55),
      dex: characteristic(70),
      app: characteristic(50),
      int: characteristic(80),
      pow: characteristic(60),
      edu: characteristic(75)
    },
    attribs: {
      hp: { value: 11, max: 11, auto: true },
      mp: { value: 12, max: 12, auto: true },
      lck: { value: 55 },
      san: { value: 60, max: 99, dailyLoss: 0, dailyLimit: 12, auto: true },
      mov: { value: 8 },
      db: { value: '1d4' },
      build: { value: 1 },
      armor: { value: '0' }
    },
    conditions: emptyConditions(),
    infos: { occupation: 'Antiquarian', age: '42', archetype: '', organization: '' },
    flags: { mythosHardened: false },
    sanityLossEvents: []
  };
  if (type === 'npc' || type === 'creature') {
    base.infos = { type: 'Ghoul', occupation: '', organization: '', age: '' };
    base.special = { sanLoss: { checkPassed: '0', checkFailled: '1d6' }, attacksPerRound: '3' };
  }
  return base;
}

function vehicleSystem(): FoundryCoc7ActorSystem {
  return {
    infos: { type: 'Car' },
    crew: { total: '4' },
    properties: { armed: false },
    stats: { hp: 30, mov: 60, build: { value: 10, current: 10 }, armor: { value: 5 } }
  };
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cursor: Record<string, unknown> = target;
  for (const part of parts.slice(0, -1)) {
    const next = cursor[part];
    if (typeof next !== 'object' || next === null) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1] ?? ''] = value;
}

function skillNameOf(name: string): string {
  const match = /^([^(]+)\s*\((.+)\)$/.exec(name);
  return (match?.[2] ?? name).trim();
}

function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase();
}

/** A fake CoC7 actor whose system methods behave like CoC7 8.16 on the data they touch. */
export function makeActor(options: FakeActorOptions = {}): FakeActor {
  const type = options.type ?? 'character';
  const base = type === 'vehicle' ? vehicleSystem() : type === 'container' ? {} : creatureSystem(type);
  const system: FoundryCoc7ActorSystem = { ...base, ...options.system };
  const items = options.items ?? [];
  const effects = (options.effects ?? []).map((status, index) => ({ id: `fx-${String(index)}`, statuses: new Set([status]) }));

  const cocidOf = (item: FoundryCoc7Item): string | undefined => item.flags.CoC7?.cocidFlag?.id;

  const actor: FakeActor = {
    id: options.id ?? 'a1',
    name: options.name ?? 'Harvey Walters',
    type,
    system,
    items: { contents: items, get: (id: string): FoundryCoc7Item | undefined => items.find((item) => item.id === id) },
    effects: { contents: effects },
    get hasTempoInsane(): boolean {
      return system.conditions?.tempoInsane.value ?? false;
    },
    get hasIndefInsane(): boolean {
      return system.conditions?.indefInsane.value ?? false;
    },
    get useMythosHardened(): boolean {
      return options.mythosHardened ?? false;
    },
    getSkillByName: (name: string): FoundryCoc7Item | undefined => {
      const wanted = normalizeName(skillNameOf(name));
      return items.find(
        (item) => item.type === 'skill' && (cocidOf(item) === name || normalizeName(item.system.skillName ?? item.name) === wanted)
      );
    },
    getFirstItemByCoCID: (cocid: string): FoundryCoc7Item | undefined => items.find((item) => cocidOf(item) === cocid),
    hasConditionStatus: (id: string): boolean => (system.conditions as Record<string, { value: boolean }> | undefined)?.[id]?.value ?? false,
    conditionsSet: jest.fn(async (ids: string[], opts: { realTime?: boolean | null; duration?: number | null } = {}) => {
      const conditions = system.conditions as Record<string, { value: boolean; realTime?: boolean; duration?: number }> | undefined;
      if (!conditions) return Promise.resolve();
      for (const id of ids) {
        const condition = conditions[id];
        if (condition) {
          condition.value = true;
          if (id === 'tempoInsane' && (opts.realTime === true || opts.realTime === false)) {
            condition.realTime = opts.realTime;
            if (opts.duration !== null && opts.duration !== undefined) condition.duration = opts.duration;
          }
        }
      }
      if (ids.includes('criticalWounds')) {
        const prone = conditions['prone'];
        if (prone) prone.value = true;
      }
      return Promise.resolve();
    }),
    conditionsUnset: jest.fn(async (ids: string[]) => {
      const conditions = system.conditions as Record<string, { value: boolean; realTime?: boolean; duration?: number }> | undefined;
      if (!conditions) return Promise.resolve();
      for (const id of ids) {
        const condition = conditions[id];
        if (condition) {
          condition.value = false;
          if (id === 'tempoInsane') {
            condition.realTime = false;
            condition.duration = 0;
          }
        }
      }
      return Promise.resolve();
    }),
    dealDamage: jest.fn(async (amount: number, opts: { armor?: string | number | null; ignoreArmor?: boolean } = {}) => {
      const attribs = system.attribs;
      if (!attribs) return Promise.resolve(0);
      const armorValue = opts.ignoreArmor ? 0 : Number(opts.armor ?? attribs.armor.value ?? 0) || 0;
      const total = amount - armorValue;
      if (total <= 0) return Promise.resolve(0);
      const hpMax = attribs.hp.max ?? 0;
      const hpNew = Math.max(0, (attribs.hp.value ?? 0) - total);
      attribs.hp.value = hpNew;
      if (total >= hpMax) {
        await actor.conditionsSet(['dead']);
      } else {
        let major = false;
        if (total >= Math.ceil(hpMax / 2)) {
          await actor.conditionsSet(['criticalWounds']);
          major = true;
        } else {
          major = actor.hasConditionStatus('criticalWounds');
        }
        if (hpNew === 0) {
          await actor.conditionsSet(major ? ['unconscious', 'dying'] : ['unconscious']);
        }
      }
      return Promise.resolve(total);
    }),
    setHp: jest.fn(async (value: number) => {
      const attribs = system.attribs;
      if (!attribs) throw new Error('HALT');
      const hpMax = attribs.hp.max ?? 0;
      const newValue = Math.min(hpMax, Math.max(0, value));
      const current = attribs.hp.value ?? 0;
      if (newValue >= current) {
        attribs.hp.value = newValue;
        return Promise.resolve(newValue);
      }
      const damage = (await actor.dealDamage(current - newValue, { ignoreArmor: true })) as number;
      return current - damage;
    }),
    spendLuck: jest.fn(async (amount: number) => {
      const attribs = system.attribs;
      if (!attribs) return Promise.resolve(false);
      const newLuck = (attribs.lck.value ?? 0) - amount;
      if (newLuck >= 0) {
        attribs.lck.value = newLuck;
        return Promise.resolve(actor);
      }
      return Promise.resolve(false);
    }),
    setLuck: jest.fn(async (value: number) => {
      const newValue = Math.min(99, value);
      if (system.attribs) system.attribs.lck.value = newValue;
      return Promise.resolve(newValue);
    }),
    enterBoutOfMadness: jest.fn(async (realTime: boolean, duration: number) => {
      if (realTime) {
        await actor.conditionsSet(['tempoInsane'], { realTime, duration });
      }
      return Promise.resolve(
        options.bout ?? { name: 'Nyctophobia', phobia: true, mania: false, description: 'Nyctophobia:<p>Fear of the <b>dark</b>.</p>' }
      );
    }),
    getReasonSanLoss: (reason: string): FoundryCoc7SanityLossEvent => {
      const name = reason.toLocaleLowerCase();
      return system.sanityLossEvents?.find((event) => event.type.toLocaleLowerCase() === name) ?? { type: '', totalLoss: 0, immunity: false };
    },
    maxLossToSanReason: (reason: string, formula: string | number): number => {
      const event = actor.getReasonSanLoss(reason);
      if (event.immunity) return 0;
      return Math.max(0, maxOf(String(formula)) - (event.totalLoss ?? 0));
    },
    setReasonSanLoss: jest.fn((reason: string, loss: number) => {
      if (reason === '') return null;
      const events = system.sanityLossEvents ?? [];
      const name = reason.toLocaleLowerCase();
      const index = events.findIndex((event) => event.type.toLocaleLowerCase() === name);
      if (loss > 0) {
        if (index === -1) events.push({ type: reason, totalLoss: loss, immunity: false });
        else {
          const event = events[index];
          if (event) event.totalLoss = (event.totalLoss ?? 0) + loss;
        }
      } else if (index > -1) {
        events.splice(index, 1);
      }
      system.sanityLossEvents = events;
      return Promise.resolve(actor);
    }),
    parsedValues: (): Record<string, unknown> => {
      const parsed: Record<string, unknown> = {};
      for (const [key, characteristic] of Object.entries(system.characteristics ?? {})) {
        parsed[key] = characteristic.value;
        parsed[key.toUpperCase()] = characteristic.value;
      }
      return parsed;
    },
    update: jest.fn(async (data: Record<string, unknown>) => {
      for (const [path, value] of Object.entries(data)) {
        setPath(actor as unknown as Record<string, unknown>, path, value);
      }
      return Promise.resolve(actor);
    })
  } as unknown as FakeActor;
  return actor;
}

export interface FakeGameOptions {
  actors?: FoundryCoc7Actor[];
  tokens?: FoundryCoc7Token[];
  sceneId?: string;
  noActiveScene?: boolean;
  settings?: Record<string, unknown>;
  users?: FoundryCoc7User[];
}

/** A fake Foundry `game` with world actors, one scene of tokens, CoC7 settings and users. */
export function makeGame(options: FakeGameOptions = {}): FoundryCoc7Game {
  const actors = options.actors ?? [];
  const tokens = options.tokens ?? [];
  const sceneId = options.sceneId ?? 's1';
  const scene: FoundryCoc7Scene = { id: sceneId, tokens: { get: (id) => tokens.find((token) => token.id === id) } };
  const settings: Record<string, unknown> = {
    defaultCheckDifficulty: 'regular',
    xpEnabled: true,
    enableStatusIcons: false,
    allowMythosHardened: false,
    boutOfMadnessRealTimeTable: 'none',
    boutOfMadnessSummaryTable: 'none',
    pulpRuleLuckHalfSanityLoss: false,
    pulpRuleIgnoreMajorWounds: false,
    ...options.settings
  };
  const users = options.users ?? [
    { id: 'gm1', isGM: true },
    { id: 'p1', isGM: false }
  ];
  return {
    actors: { get: (id) => actors.find((actor) => actor.id === id) },
    scenes: {
      get: (id) => (id === sceneId ? scene : undefined),
      active: options.noActiveScene ? null : scene
    },
    users: { contents: users, filter: (predicate) => users.filter(predicate) },
    settings: { get: (_scope, key) => settings[key] }
  };
}

export interface FakeChatMessage {
  create: jest.Mock;
  getSpeaker: jest.Mock;
  getWhisperRecipients: jest.Mock;
}

/** Installs a fake `ChatMessage` global; returns the mocks. Call `uninstallFakeChatMessage` afterwards. */
export function installFakeChatMessage(): FakeChatMessage {
  const fake: FakeChatMessage = {
    create: jest.fn().mockResolvedValue({ id: 'card-1' }),
    getSpeaker: jest.fn(() => ({ alias: 'Speaker' })),
    getWhisperRecipients: jest.fn(() => [{ id: 'gm1' }])
  };
  (globalThis as Record<string, unknown>)['ChatMessage'] = fake;
  return fake;
}

export function uninstallFakeChatMessage(): void {
  delete (globalThis as Record<string, unknown>)['ChatMessage'];
}

export const byActor = { actorId: 'a1', tokenId: undefined, sceneId: undefined } as const;
