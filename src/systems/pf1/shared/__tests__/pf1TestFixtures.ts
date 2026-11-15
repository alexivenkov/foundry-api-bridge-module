import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import type {
  FoundryPf1Actor,
  FoundryPf1ActorSystem,
  FoundryPf1ChatAttack,
  FoundryPf1Game,
  FoundryPf1Item,
  FoundryPf1ItemSystem,
  FoundryPf1ItemUseResult,
  FoundryPf1Registry,
  FoundryPf1RollResult,
  FoundryRollData
} from '@/systems/pf1/shared/infrastructure';

export const byActor: Pf1ActorTarget = { actorId: 'a1', tokenId: undefined, sceneId: undefined };

/**
 * A serialized `D20RollPF`: `naturals` are the d20 faces (several for `2d20kh`,
 * the first one kept), `bonus` the flat modifier on top.
 */
export function d20RollData(naturals: number[], bonus: number, options: FoundryRollData['options'] = {}): FoundryRollData {
  const kept = naturals[0] ?? 0;
  return {
    class: 'D20RollPF',
    formula: `${naturals.length > 1 ? `${String(naturals.length)}d20kh` : '1d20'} + ${String(bonus)}`,
    total: kept + bonus,
    terms: [
      {
        class: 'Die',
        faces: 20,
        number: naturals.length,
        results: naturals.map((result, index) => ({ result, active: index === 0 }))
      },
      { class: 'OperatorTerm' },
      { class: 'NumericTerm', number: bonus }
    ],
    options: { critical: 20, ...options }
  };
}

/** A serialized `DamageRoll` of one die term plus a flat bonus. */
export function damageRollData(faces: number, results: number[], bonus: number, damageType: string[] = ['untyped']): FoundryRollData {
  return {
    class: 'DamageRoll',
    formula: `${String(results.length)}d${String(faces)} + ${String(bonus)}`,
    total: results.reduce((sum, r) => sum + r, 0) + bonus,
    terms: [
      { class: 'Die', faces, number: results.length, results: results.map((result) => ({ result, active: true })) },
      { class: 'OperatorTerm' },
      { class: 'NumericTerm', number: bonus }
    ],
    options: { damageType, type: 'normal' }
  };
}

/** A live roll instance: the gateways read it through `toJSON()`. */
export function liveRoll(data: FoundryRollData): { toJSON(): FoundryRollData } {
  return { toJSON: () => data };
}

/** What `pf1.dice.d20Roll` answers with `chatMessage: false`: message data with the roll as a JSON string. */
export function messageData(roll: FoundryRollData): FoundryPf1RollResult {
  return { rolls: [JSON.stringify(roll)] };
}

/** What `pf1.dice.d20Roll` answers when it posted: a ChatMessage with live rolls. */
export function createdMessage(roll: FoundryRollData, id = 'msg-1'): FoundryPf1RollResult {
  return { id, rolls: [liveRoll(roll)] };
}

export interface FakePf1Item extends FoundryPf1Item {
  use: jest.Mock;
}

export function makeItem(overrides: Partial<FoundryPf1Item> & { system?: FoundryPf1ItemSystem } = {}): FakePf1Item {
  return {
    id: 'i1',
    name: 'Longsword',
    type: 'weapon',
    system: { actions: [{ _id: 'act1', name: 'Attack' }] },
    use: jest.fn<Promise<FoundryPf1ItemUseResult>, []>().mockResolvedValue({ shared: { chatAttacks: [] } }),
    ...overrides
  } as FakePf1Item;
}

export function chatAttack(overrides: Partial<FoundryPf1ChatAttack> = {}): FoundryPf1ChatAttack {
  return {
    label: 'Attack',
    attack: null,
    critConfirm: null,
    damage: { total: 0, rolls: [] },
    critDamage: { total: 0, rolls: [] },
    ...overrides
  };
}

const SKILL_NAMES: Record<string, string> = {
  acr: 'Acrobatics',
  per: 'Perception',
  crf: 'Craft',
  'crf.alchemy': 'Alchemy'
};

export function fullSystem(): FoundryPf1ActorSystem {
  return {
    abilities: {
      str: { value: 16, total: 16, mod: 3, damage: 0, drain: 0 },
      dex: { value: 14, total: 14, mod: 2, damage: 0, drain: 0 },
      con: { value: 12, total: 12, mod: 1, damage: 0, drain: 0 },
      int: { value: 10, total: 10, mod: 0, damage: 2, drain: 0 },
      wis: { value: 13, total: 13, mod: 1, damage: 0, drain: 0 },
      cha: { value: 8, total: 8, mod: -1, damage: 0, drain: 0 }
    },
    attributes: {
      hp: { value: 20, max: 28, temp: 0, nonlethal: 0 },
      vigor: { value: 0, max: 0, temp: 0 },
      wounds: { value: 0, max: 0 },
      ac: { normal: { total: 18 }, touch: { total: 12 }, flatFooted: { total: 16 } },
      cmd: { total: 19, flatFootedTotal: 17 },
      cmb: { total: 6 },
      bab: { total: 3 },
      init: { total: 2 },
      sr: { total: 0 },
      savingThrows: { fort: { total: 5 }, ref: { total: 3 }, will: { total: 2 } },
      speed: { land: { total: 30 }, swim: { total: 0 }, fly: { total: 0 } },
      spells: {
        spellbooks: {
          primary: { inUse: true, name: 'Cleric', class: 'cleric', cl: { total: 3 }, concentration: { total: 5 } },
          secondary: { inUse: false, name: '', class: '', cl: { total: 0 } }
        }
      }
    },
    details: { level: { value: 3 }, alignment: 'lg' },
    skills: {
      acr: { rank: 1, mod: 4, rt: false, cs: true },
      per: { rank: 3, mod: 7, rt: false, cs: true },
      crf: { rank: 0, mod: 0, rt: false, cs: true, subSkills: { alchemy: { rank: 2, mod: 5, rt: false, cs: true } } }
    }
  };
}

export interface FakePf1Actor extends FoundryPf1Actor {
  rollAbilityTest: jest.Mock;
  rollSkill: jest.Mock;
  rollSavingThrow: jest.Mock;
  rollCL: jest.Mock;
  rollConcentration: jest.Mock;
  applyDamage: jest.Mock;
  setConditions: jest.Mock;
}

export interface FakeActorOptions {
  id?: string;
  name?: string;
  type?: string;
  system?: FoundryPf1ActorSystem;
  items?: FoundryPf1Item[];
  statuses?: string[];
  roll?: FoundryPf1RollResult | undefined;
}

/**
 * A pf1 actor whose roll methods answer `options.roll` (a natural 12 + 5 by
 * default), `getSkillInfo` follows the system (throws for unknown ids), and
 * `applyDamage` / `setConditions` mutate the system data the way pf1 does.
 */
export function makeActor(options: FakeActorOptions = {}): FakePf1Actor {
  const system = options.system ?? fullSystem();
  const items = options.items ?? [];
  const statuses = new Set(options.statuses ?? []);
  const roll = 'roll' in options ? options.roll : messageData(d20RollData([12], 5));
  const rolling = (): jest.Mock => jest.fn().mockResolvedValue(roll);

  const actor: FakePf1Actor = {
    id: options.id ?? 'a1',
    name: options.name ?? 'Valeros',
    type: options.type ?? 'character',
    system,
    items: {
      contents: items,
      get: (id: string) => items.find((item) => item.id === id)
    },
    statuses,
    getSkillInfo(skillId: string) {
      const [main, sub] = skillId.split('.');
      const skill = main === undefined ? undefined : system.skills?.[main];
      const data = sub === undefined ? skill : skill?.subSkills?.[sub];
      if (!data) {
        throw new Error(`Invalid skill ID '${skillId}'`);
      }
      const name = SKILL_NAMES[skillId] ?? skillId;
      const fullName = sub === undefined ? name : `${SKILL_NAMES[main ?? ''] ?? main ?? ''} (${name})`;
      return { id: skillId, name, fullName };
    },
    rollAbilityTest: rolling(),
    rollSkill: rolling(),
    rollSavingThrow: rolling(),
    rollCL: rolling(),
    rollConcentration: rolling(),
    applyDamage: jest.fn((value: number, opts: { asNonlethal?: boolean } = {}) => {
      const hp = system.attributes?.hp;
      if (!hp || value === 0) {
        return Promise.resolve(false);
      }
      if (opts.asNonlethal === true) {
        hp.nonlethal = (hp.nonlethal ?? 0) + value;
      } else {
        const temp = hp.temp ?? 0;
        const absorbed = value > 0 ? Math.min(temp, value) : 0;
        hp.temp = temp - absorbed;
        hp.value = Math.min((hp.value ?? 0) - (value - absorbed), hp.max ?? 0);
      }
      return Promise.resolve(actor);
    }),
    setConditions: jest.fn((conditions: Record<string, boolean>) => {
      const changes: Record<string, boolean> = {};
      for (const [id, active] of Object.entries(conditions)) {
        if (active && (id === 'paralyzed' && actor.name === 'Golem')) {
          continue; // immune
        }
        if (active !== statuses.has(id)) {
          changes[id] = active;
          if (active) statuses.add(id);
          else statuses.delete(id);
        }
      }
      return Promise.resolve(changes);
    })
  };
  return actor;
}

export function makeRegistry(ids: string[] = ['shaken', 'frightened', 'flatFooted', 'prone', 'paralyzed']): FoundryPf1Registry {
  const conditions = ids.map((id) => ({ _id: id, id, name: id }));
  return {
    conditions: {
      get: (id: string) => conditions.find((condition) => condition.id === id),
      contents: conditions
    }
  };
}

export interface FakeGameOptions {
  actors?: FoundryPf1Actor[];
  tokens?: { id: string; name: string; actor: FoundryPf1Actor | null }[];
}

export function makeGame(options: FakeGameOptions = {}): FoundryPf1Game {
  const actors = options.actors ?? [];
  const tokens = options.tokens ?? [];
  const scene = { id: 's1', tokens: { get: (id: string) => tokens.find((token) => token.id === id) } };
  return {
    actors: { get: (id: string) => actors.find((actor) => actor.id === id) },
    scenes: { get: (id: string) => (id === 's1' ? scene : undefined), active: scene }
  };
}
