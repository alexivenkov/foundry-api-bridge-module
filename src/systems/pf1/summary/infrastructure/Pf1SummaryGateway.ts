import { PF1_ABILITY_KEYS, PF1_SAVE_KEYS, type Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import {
  activePf1Conditions,
  readPf1Health,
  resolvePf1Actor,
  skillIdsOf,
  skillInfoOf,
  skillNameOf,
  usesWoundsAndVigor,
  type FoundryPf1Actor,
  type FoundryPf1Game,
  type FoundryPf1Registry,
  type FoundryPf1SkillData
} from '@/systems/pf1/shared/infrastructure';
import type {
  Pf1AbilitySummary,
  Pf1ActorSummary,
  Pf1SkillSummary,
  Pf1SpellbookSummary,
  Pf1SummaryPort
} from '@/systems/pf1/summary/domain';

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function skillData(actor: FoundryPf1Actor, id: string): FoundryPf1SkillData | undefined {
  const [main, sub] = id.split('.');
  const skill = main === undefined ? undefined : actor.system.skills?.[main];
  return sub === undefined ? skill : skill?.subSkills?.[sub];
}

/**
 * Reads the normalized PF1 sheet (pf1 11.11) from the actor's prepared data:
 * the derived `total` / `mod` values the sheet shows. Fields an actor type does
 * not have (a trap's abilities, a haunt's skills) come back null or empty.
 */
export class Pf1SummaryGateway implements Pf1SummaryPort {
  constructor(
    private readonly game: FoundryPf1Game,
    private readonly registry: FoundryPf1Registry | undefined
  ) {}

  getSummary(target: Pf1ActorTarget): Promise<Pf1ActorSummary> {
    const { actor, tokenId } = resolvePf1Actor(this.game, target);
    const system = actor.system;
    const attributes = system.attributes ?? {};
    const items = actor.items.contents;

    const abilities: Partial<Record<(typeof PF1_ABILITY_KEYS)[number], Pf1AbilitySummary>> = {};
    for (const key of PF1_ABILITY_KEYS) {
      const ability = system.abilities?.[key];
      if (ability !== undefined) {
        abilities[key] = {
          total: numberOrNull(ability.total),
          mod: numberOrNull(ability.mod),
          damage: numberOrNull(ability.damage) ?? 0,
          drain: numberOrNull(ability.drain) ?? 0
        };
      }
    }

    const saves: Partial<Record<(typeof PF1_SAVE_KEYS)[number], number | null>> = {};
    for (const key of PF1_SAVE_KEYS) {
      const save = attributes.savingThrows?.[key];
      if (save !== undefined) {
        saves[key] = numberOrNull(save.total);
      }
    }

    const speed: Record<string, number> = {};
    for (const [mode, data] of Object.entries(attributes.speed ?? {})) {
      const value = numberOrNull(data.total);
      if (value !== null && value > 0) {
        speed[mode] = value;
      }
    }

    const skills: Pf1SkillSummary[] = skillIdsOf(actor).map((id) => {
      const data = skillData(actor, id);
      return {
        id,
        name: skillNameOf(skillInfoOf(actor, id), id),
        mod: numberOrNull(data?.mod),
        rank: numberOrNull(data?.rank) ?? 0,
        classSkill: data?.cs === true,
        trainedOnly: data?.rt === true
      };
    });

    const spellbooks: Pf1SpellbookSummary[] = Object.entries(attributes.spells?.spellbooks ?? {})
      .filter(([, book]) => book.inUse === true)
      .map(([id, book]) => ({
        id,
        name: book.name || book.label || id,
        class: book.class ?? '',
        casterLevel: numberOrNull(book.cl?.total),
        concentration: numberOrNull(book.concentration?.total)
      }));

    const summary: { -readonly [K in keyof Pf1ActorSummary]: Pf1ActorSummary[K] } = {
      actorId: actor.id,
      name: actor.name,
      type: actor.type,
      level: numberOrNull(system.details?.level?.value),
      cr: numberOrNull(system.details?.cr?.total ?? system.cr?.total),
      alignment: system.details?.alignment ?? null,
      abilities,
      health: attributes.hp === undefined ? null : readPf1Health(actor, usesWoundsAndVigor(this.game, actor)),
      ac: {
        normal: numberOrNull(attributes.ac?.normal?.total),
        touch: numberOrNull(attributes.ac?.touch?.total),
        flatFooted: numberOrNull(attributes.ac?.flatFooted?.total)
      },
      cmb: numberOrNull(attributes.cmb?.total),
      cmd: numberOrNull(attributes.cmd?.total),
      cmdFlatFooted: numberOrNull(attributes.cmd?.flatFootedTotal),
      bab: numberOrNull(attributes.bab?.total),
      initiative: numberOrNull(attributes.init?.total),
      sr: numberOrNull(attributes.sr?.total),
      saves,
      speed,
      conditions: activePf1Conditions(actor, this.registry),
      classes: items
        .filter((item) => item.type === 'class')
        .map((item) => ({ id: item.id, name: item.name, level: numberOrNull(item.system.level) })),
      skills,
      spellbooks,
      spells: items
        .filter((item) => item.type === 'spell')
        .map((item) => ({
          id: item.id,
          name: item.name,
          level: numberOrNull(item.system.level),
          spellbook: item.system.spellbook ?? '',
          prepared: numberOrNull(item.system.preparation?.value),
          preparedMax: numberOrNull(item.system.preparation?.max)
        })),
      usableItems: items
        .filter((item) => item.type !== 'spell' && (item.system.actions?.length ?? 0) > 0)
        .map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          actions: (item.system.actions ?? []).map((action) => ({ id: action._id ?? '', name: action.name ?? '' }))
        })),
      activeBuffs: items
        .filter((item) => item.type === 'buff' && item.system.active === true)
        .map((item) => ({ id: item.id, name: item.name, level: numberOrNull(item.system.level) }))
    };
    if (tokenId !== undefined) {
      summary.tokenId = tokenId;
    }
    return Promise.resolve(summary);
  }
}
