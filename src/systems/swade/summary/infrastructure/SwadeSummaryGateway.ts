import { SWADE_ATTRIBUTE_KEYS, type SwadeActorTarget, type SwadeAttributeKey } from '@/systems/swade/shared/domain';
import {
  resolveSwadeActor,
  type FoundrySwadeActor,
  type FoundrySwadeGame,
  type FoundrySwadeItem
} from '@/systems/swade/shared/infrastructure';
import type {
  SwadeActorSummary,
  SwadeAttributeSummary,
  SwadeInitiativeSummary,
  SwadePowerSummary,
  SwadeSkillSummary,
  SwadeStatusSummary,
  SwadeSummaryPort,
  SwadeVehicleSummary,
  SwadeWeaponSummary
} from '@/systems/swade/summary/domain';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

const ACTOR_TYPES = new Set<string>(['character', 'npc', 'vehicle', 'group']);

function num(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function statusOf(actor: FoundrySwadeActor): SwadeStatusSummary {
  const has = (id: string): boolean => actor.statuses.has(id);
  return {
    shaken: has('shaken'),
    stunned: has('stunned'),
    distracted: has('distracted') || actor.system.status?.isDistracted === true,
    vulnerable: has('vulnerable') || actor.system.status?.isVulnerable === true,
    entangled: has('entangled'),
    bound: has('bound'),
    incapacitated: has('incapacitated'),
    active: Array.from(actor.statuses)
  };
}

function weaponOf(item: FoundrySwadeItem): SwadeWeaponSummary {
  const s = item.system;
  return {
    id: item.id,
    name: item.name,
    damage: str(s.damage),
    ap: num(s.ap),
    rof: num(s.rof),
    range: str(s.range),
    parry: num(s.parry),
    minStr: str(s.minStr),
    trait: str(s.actions?.trait),
    traitMod: str(s.actions?.traitMod),
    dmgMod: str(s.actions?.dmgMod),
    equipStatus: num(s.equipStatus),
    shots: num(s.shots),
    currentShots: num(s.currentShots),
    isMelee: s.isMelee === true,
    isHeavyWeapon: s.isHeavyWeapon === true
  };
}

function powerOf(item: FoundrySwadeItem): SwadePowerSummary {
  const s = item.system;
  return {
    id: item.id,
    name: item.name,
    pp: num(s.pp),
    arcane: str(s.arcane),
    rank: str(s.rank),
    range: str(s.range),
    duration: str(s.duration),
    damage: str(s.damage)
  };
}

function skillOf(item: FoundrySwadeItem): SwadeSkillSummary {
  const s = item.system;
  return {
    id: item.id,
    name: item.name,
    die: num(s.die?.sides),
    modifier: num(s.die?.modifier),
    wildDie: num(s['wild-die']?.sides),
    attribute: str(s.attribute)
  };
}

/**
 * Side-effect-free read of a SWADE sheet (swade 6.0.4 data models): creature
 * stats from `system.stats`/`system.wounds`/…, wound and fatigue penalties
 * from the actor's own `calcWoundPenalties`/`calcFatiguePenalties`, vehicles
 * from `system.toughness`/`handling`/`topspeed`/`status`.
 */
export class SwadeSummaryGateway implements SwadeSummaryPort {
  constructor(private readonly game: FoundrySwadeGame) {}

  getSummary(target: SwadeActorTarget): Promise<SwadeActorSummary> {
    try {
      return Promise.resolve(this.summarize(target));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private summarize(target: SwadeActorTarget): SwadeActorSummary {
    const { actor, tokenId } = resolveSwadeActor(this.game, target);
    const type = ACTOR_TYPES.has(actor.type) ? (actor.type as SwadeActorSummary['type']) : 'npc';
    const items = actor.items.contents;

    const summary: Mutable<SwadeActorSummary> = {
      actorId: actor.id,
      name: actor.name,
      type,
      wildcard: actor.isWildcard,
      status: statusOf(actor),
      weapons: items.filter((item) => item.type === 'weapon').map(weaponOf),
      powers: items.filter((item) => item.type === 'power').map(powerOf)
    };
    if (tokenId !== undefined) {
      summary.tokenId = tokenId;
    }

    if (type === 'character' || type === 'npc') {
      this.addCreatureSections(actor, summary);
      summary.skills = items.filter((item) => item.type === 'skill').map(skillOf);
    }
    if (type === 'vehicle') {
      summary.vehicle = this.vehicleOf(actor);
      summary.initiative = this.initiativeOf(actor);
    }
    return summary;
  }

  private addCreatureSections(actor: FoundrySwadeActor, summary: Mutable<SwadeActorSummary>): void {
    const system = actor.system;
    const attributes = system.attributes;
    if (attributes) {
      const mapped: Partial<Record<SwadeAttributeKey, SwadeAttributeSummary>> = {};
      for (const key of SWADE_ATTRIBUTE_KEYS) {
        const attribute = attributes[key];
        if (attribute) {
          mapped[key] = {
            die: num(attribute.die.sides),
            modifier: num(attribute.die.modifier),
            wildDie: num(attribute['wild-die'].sides)
          };
        }
      }
      if (Object.keys(mapped).length === SWADE_ATTRIBUTE_KEYS.length) {
        summary.attributes = mapped as Record<SwadeAttributeKey, SwadeAttributeSummary>;
      }
    }

    const stats = system.stats;
    if (stats?.toughness && stats.parry) {
      const runningDie = system.pace?.running?.die;
      summary.derived = {
        parry: num(stats.parry.value),
        toughness: num(stats.toughness.value),
        armor: num(stats.toughness.armor),
        size: num(stats.size),
        pace: num(system.pace?.default),
        runningDie: runningDie !== undefined ? `d${String(num(runningDie))}` : null
      };
    }
    if (system.bennies) {
      summary.bennies = { value: num(system.bennies.value), max: num(system.bennies.max) };
    }
    if (system.wounds) {
      summary.wounds = {
        value: num(system.wounds.value),
        max: num(system.wounds.max),
        ignored: num(system.wounds.ignored),
        penalty: actor.calcWoundPenalties()
      };
    }
    if (system.fatigue) {
      summary.fatigue = {
        value: num(system.fatigue.value),
        max: num(system.fatigue.max),
        penalty: actor.calcFatiguePenalties()
      };
    }
    if (system.powerPoints) {
      const pools: Record<string, { value: number; max: number }> = {};
      for (const [arcane, pool] of Object.entries(system.powerPoints)) {
        pools[arcane] = { value: num(pool.value), max: num(pool.max) };
      }
      summary.powerPoints = pools;
    }
    const conviction = system.details?.conviction;
    if (conviction) {
      summary.conviction = { value: num(conviction.value), active: conviction.active };
    }
    const rank = system.advances?.rank;
    if (rank !== undefined && rank !== '') {
      summary.rank = rank;
    }
    summary.initiative = this.initiativeOf(actor);
  }

  private initiativeOf(actor: FoundrySwadeActor): SwadeInitiativeSummary {
    const initiative = actor.system.initiative ?? {};
    return {
      levelHeaded: initiative.hasLevelHeaded === true,
      improvedLevelHeaded: initiative.hasImpLevelHeaded === true,
      quick: initiative.hasQuick === true,
      hesitant: initiative.hasHesitant === true
    };
  }

  private vehicleOf(actor: FoundrySwadeActor): SwadeVehicleSummary {
    const system = actor.system;
    return {
      toughness: num(system.toughness?.total),
      armor: num(system.toughness?.armor),
      wounds: { value: num(system.wounds?.value), max: num(system.wounds?.max) },
      handling: num(system.handling),
      topSpeed: { value: num(system.topspeed?.value), unit: str(system.topspeed?.unit) },
      outOfControl: system.status?.isOutOfControl === true,
      wrecked: system.status?.isWrecked === true
    };
  }
}
