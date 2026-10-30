import { ValidationError } from '@/systems/shared/domain/errors';
import { COC7_CHARACTERISTIC_KEYS, type Coc7ActorTarget, type Coc7Conditions } from '@/systems/coc7/shared/domain';
import {
  readCoc7Conditions,
  readCoc7Statuses,
  resolveCoc7Actor,
  skillRefOf,
  weaponDamageFormulas,
  weaponPropertyKeys,
  type FoundryCoc7Actor,
  type FoundryCoc7Game,
  type FoundryCoc7Item
} from '@/systems/coc7/shared/infrastructure';
import type {
  Coc7ActorSummaryOutcome,
  Coc7AttributesSummary,
  Coc7CharacteristicSummary,
  Coc7CreatureSummary,
  Coc7SkillSummary,
  Coc7SpellSummary,
  Coc7SummaryPort,
  Coc7VehicleSummary,
  Coc7WeaponSummary
} from '@/systems/coc7/summary/domain';

const NO_CONDITIONS: Coc7Conditions = {
  criticalWounds: false,
  unconscious: false,
  dying: false,
  dead: false,
  prone: false,
  tempoInsane: false,
  indefInsane: false
};

function characteristicsOf(actor: FoundryCoc7Actor): Coc7CharacteristicSummary[] {
  const characteristics = actor.system.characteristics;
  if (characteristics === undefined) {
    return [];
  }
  return COC7_CHARACTERISTIC_KEYS.map((key) => {
    const value = characteristics[key].value ?? 0;
    return { key, label: key.toUpperCase(), value, half: Math.floor(value / 2), fifth: Math.floor(value / 5) };
  });
}

function attributesOf(actor: FoundryCoc7Actor): Coc7AttributesSummary | undefined {
  const attribs = actor.system.attribs;
  if (attribs === undefined) {
    return undefined;
  }
  return {
    hp: { value: attribs.hp.value ?? 0, max: attribs.hp.max ?? 0 },
    mp: { value: attribs.mp.value ?? 0, max: attribs.mp.max ?? 0 },
    sanity: {
      value: attribs.san.value ?? 0,
      max: attribs.san.max,
      dailyLoss: attribs.san.dailyLoss,
      dailyLimit: attribs.san.dailyLimit,
      mythosHardened: actor.useMythosHardened
    },
    luck: attribs.lck.value ?? 0,
    mov: attribs.mov.value ?? 0,
    db: String(attribs.db.value ?? '0'),
    build: attribs.build.value ?? 0,
    armor: String(attribs.armor.value ?? '0')
  };
}

function skillsOf(actor: FoundryCoc7Actor): Coc7SkillSummary[] {
  return actor.items.contents
    .filter((item) => item.type === 'skill')
    .map((item): Coc7SkillSummary => {
      const value = item.system.value ?? 0;
      const properties = item.system.properties;
      const specialization = (item.system.specialization ?? '').trim();
      return {
        id: item.id,
        name: item.name,
        value,
        half: Math.floor(value / 2),
        fifth: Math.floor(value / 5),
        base: item.system.base ?? '',
        ...(specialization !== '' ? { specialization } : {}),
        push: properties?.push === true,
        fighting: properties?.fighting === true,
        firearm: properties?.firearm === true,
        special: properties?.special === true,
        rare: properties?.rarity === true,
        development: item.system.flags?.developement === true
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function weaponOf(actor: FoundryCoc7Actor, weapon: FoundryCoc7Item): Coc7WeaponSummary {
  const skill = skillRefOf(weapon.system.skillMain);
  const alternativeId = weapon.system.skill?.alternativ.id ?? '';
  const alternativeSkill = alternativeId !== '' ? skillRefOf(weapon.system.skillAlternative) : undefined;
  const range = weapon.system.range;
  const ranges: { normal: string; long?: string; extreme?: string } = { normal: range?.normal.value ?? '' };
  for (const band of ['long', 'extreme'] as const) {
    const value = (range?.[band].value ?? '').trim();
    if (value !== '') {
      ranges[band] = value;
    }
  }
  const bullets = weapon.system.bullets;
  const malfunction = weapon.system.malfunction;
  const ammo = weapon.system.ammo ?? 0;
  const usesPerRound = (weapon.system.usesPerRound?.normal ?? '').trim();
  return {
    id: weapon.id,
    name: weapon.name,
    ...(skill !== undefined ? { skill } : {}),
    ...(alternativeSkill !== undefined ? { alternativeSkill } : {}),
    ranged: weapon.system.properties?.['rngd'] === true,
    damage: weaponDamageFormulas(actor, weapon),
    range: ranges,
    usesPerRound: usesPerRound === '' ? '1' : usesPerRound,
    ...(typeof bullets === 'number' ? { bullets } : {}),
    ...(typeof bullets === 'number' || ammo > 0 ? { ammo } : {}),
    ...(typeof malfunction === 'number' && malfunction > 0 ? { malfunction } : {}),
    impaling: weapon.system.properties?.['impl'] === true,
    properties: weaponPropertyKeys(weapon)
  };
}

function spellsOf(actor: FoundryCoc7Actor): Coc7SpellSummary[] {
  return actor.items.contents
    .filter((item) => item.type === 'spell')
    .map((item) => ({
      id: item.id,
      name: item.name,
      costs: {
        hitPoints: item.system.costs?.hitPoints ?? '0',
        magicPoints: item.system.costs?.magicPoints ?? '0',
        sanity: item.system.costs?.sanity ?? '0',
        power: item.system.costs?.power ?? '0',
        others: item.system.costs?.others ?? ''
      }
    }));
}

function creditRatingOf(actor: FoundryCoc7Actor): number | undefined {
  const skill = actor.getFirstItemByCoCID('i.skill.credit-rating') ?? actor.getSkillByName('Credit Rating');
  return skill && skill.type === 'skill' ? (skill.system.value ?? 0) : undefined;
}

function creatureOf(actor: FoundryCoc7Actor): Coc7CreatureSummary | undefined {
  if (actor.type !== 'npc' && actor.type !== 'creature') {
    return undefined;
  }
  const special = actor.system.special;
  return {
    sanLoss: { passed: special?.sanLoss?.checkPassed ?? '', failed: special?.sanLoss?.checkFailled ?? '' },
    attacksPerRound: special?.attacksPerRound ?? '1'
  };
}

function vehicleOf(actor: FoundryCoc7Actor): Coc7VehicleSummary {
  const stats = actor.system.stats;
  const hp = stats?.hp ?? undefined;
  const mov = stats?.mov ?? undefined;
  const build = stats?.build.value ?? undefined;
  const armor = stats?.armor.value ?? undefined;
  return {
    ...(hp !== undefined ? { hp } : {}),
    ...(mov !== undefined ? { mov } : {}),
    ...(build !== undefined ? { build } : {}),
    ...(armor !== undefined ? { armor } : {}),
    crew: actor.system.crew?.total ?? '',
    armed: actor.system.properties?.armed === true
  };
}

/**
 * Anti-corruption layer over the CoC7 sheet (CoC7 8.16): characteristics
 * with their half and fifth, the attributes block, conditions, phobias and
 * manias, skills with their flags, weapons with the damage bonus applied,
 * spells with their costs. Vehicles keep `system.stats`; containers carry nothing to summarize.
 */
export class Coc7SummaryGateway implements Coc7SummaryPort {
  constructor(private readonly game: FoundryCoc7Game) {}

  async getSummary(target: Coc7ActorTarget): Promise<Coc7ActorSummaryOutcome> {
    const { actor } = resolveCoc7Actor(this.game, target);
    if (actor.type === 'container') {
      throw new ValidationError('Actor type is not supported: container');
    }
    const weapons = actor.items.contents.filter((item) => item.type === 'weapon').map((weapon) => weaponOf(actor, weapon));
    const infos = actor.system.infos;
    const archetype = (infos?.archetype ?? '').trim();
    const organization = (infos?.organization ?? '').trim();
    const base = {
      id: actor.id,
      name: actor.name,
      type: actor.type,
      statuses: readCoc7Statuses(actor),
      spells: spellsOf(actor),
      weapons,
      infos: {
        occupation: infos?.occupation ?? '',
        age: infos?.age ?? '',
        ...(archetype !== '' ? { archetype } : {}),
        ...(organization !== '' ? { organization } : {})
      }
    };
    if (actor.type === 'vehicle') {
      return Promise.resolve({
        ...base,
        characteristics: [],
        conditions: NO_CONDITIONS,
        skills: [],
        vehicle: vehicleOf(actor)
      });
    }
    const attributes = attributesOf(actor);
    const creditRating = creditRatingOf(actor);
    const creature = creatureOf(actor);
    return Promise.resolve({
      ...base,
      characteristics: characteristicsOf(actor),
      ...(attributes !== undefined ? { attributes } : {}),
      conditions: actor.system.conditions !== undefined ? readCoc7Conditions(actor) : NO_CONDITIONS,
      skills: skillsOf(actor),
      ...(creditRating !== undefined ? { creditRating } : {}),
      ...(creature !== undefined ? { creature } : {})
    });
  }
}
