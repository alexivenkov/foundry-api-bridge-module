import type { ActorHitPoints, ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import {
  ABILITY_KEYS,
  AbilityKey,
  ActorType,
  CreatureType,
  Disposition,
  Size,
  parseActorType,
  parseCreatureType,
  parseSize
} from '@/filtering/actors/domain/value-objects';

import {
  FOUNDRY_DISPOSITIONS,
  type FoundryActor,
  type FoundryCrField
} from './foundryActorTypes';

export class FoundryActorMapper {
  toSnapshot(raw: FoundryActor): ActorSnapshot {
    const type = this.extractActorType(raw.type);
    return {
      id: raw.id,
      name: raw.name,
      type,
      hasPlayerOwner: raw.hasPlayerOwner,
      folderId: raw.folder?.id ?? null,
      creatureType: this.extractCreatureType(raw),
      size: this.extractSize(raw),
      disposition: this.extractDisposition(raw),
      cr: this.extractCr(raw),
      level: this.extractLevel(raw, type),
      hp: this.extractHp(raw),
      ac: this.extractAc(raw),
      abilities: this.extractAbilities(raw)
    };
  }

  // Foundry-side actor.type may be a non-core value injected by a custom system.
  // We only filter by the four core types; treat anything unknown as Npc — this
  // keeps the actor visible to filters but excluded from PC/Vehicle/Group queries.
  private extractActorType(raw: string): ActorType {
    try {
      return parseActorType(raw);
    } catch {
      return ActorType.Npc;
    }
  }

  private extractCreatureType(raw: FoundryActor): CreatureType | null {
    const typeField = raw.system.details?.type;
    let creatureTypeStr: string | undefined;

    if (typeof typeField === 'string') {
      creatureTypeStr = typeField;
    } else if (typeField !== undefined && typeof typeField === 'object') {
      creatureTypeStr = typeField.value;
    }

    if (creatureTypeStr === undefined || creatureTypeStr === '') {
      return null;
    }

    try {
      return parseCreatureType(creatureTypeStr);
    } catch {
      return null;
    }
  }

  private extractSize(raw: FoundryActor): Size | null {
    const sizeStr = raw.system.traits?.size;
    if (sizeStr === undefined || sizeStr === '') {
      return null;
    }
    try {
      return parseSize(sizeStr);
    } catch {
      return null;
    }
  }

  private extractDisposition(raw: FoundryActor): Disposition | null {
    const disp = raw.prototypeToken?.disposition;
    if (disp === undefined) {
      return null;
    }
    switch (disp) {
      case FOUNDRY_DISPOSITIONS.HOSTILE:
        return Disposition.Hostile;
      case FOUNDRY_DISPOSITIONS.NEUTRAL:
        return Disposition.Neutral;
      case FOUNDRY_DISPOSITIONS.FRIENDLY:
        return Disposition.Friendly;
      case FOUNDRY_DISPOSITIONS.SECRET:
        return Disposition.Secret;
      default:
        return null;
    }
  }

  private extractCr(raw: FoundryActor): number | null {
    const crField: FoundryCrField = raw.system.details?.cr;
    if (crField === undefined) {
      return null;
    }

    let crValue: unknown;
    if (typeof crField === 'number') {
      crValue = crField;
    } else if ('value' in crField) {
      crValue = crField.value;
    }

    if (typeof crValue !== 'number' || !Number.isFinite(crValue)) {
      return null;
    }
    return crValue;
  }

  // Level is meaningful only for player characters in dnd5e.
  // Prefer system.details.level (modern), fall back to system.attributes.level (legacy).
  private extractLevel(raw: FoundryActor, type: ActorType): number | null {
    if (type !== ActorType.Character) {
      return null;
    }
    const detailsLevel = raw.system.details?.level;
    if (typeof detailsLevel === 'number' && Number.isFinite(detailsLevel)) {
      return detailsLevel;
    }
    const attributesLevel = raw.system.attributes?.level;
    if (typeof attributesLevel === 'number' && Number.isFinite(attributesLevel)) {
      return attributesLevel;
    }
    return null;
  }

  private extractHp(raw: FoundryActor): ActorHitPoints | null {
    const hp = raw.system.attributes?.hp;
    if (hp === undefined) {
      return null;
    }
    const current = hp.value;
    const max = hp.max;
    if (typeof current !== 'number' || typeof max !== 'number') {
      return null;
    }
    if (!Number.isFinite(current) || !Number.isFinite(max)) {
      return null;
    }
    return { current, max };
  }

  private extractAc(raw: FoundryActor): number | null {
    const ac = raw.system.attributes?.ac?.value;
    if (typeof ac !== 'number' || !Number.isFinite(ac)) {
      return null;
    }
    return ac;
  }

  // All-or-nothing: if any of the 6 abilities is missing or invalid, return null.
  // This matches ActorSnapshot's contract: `abilities: Record<AbilityKey, number> | null`.
  private extractAbilities(raw: FoundryActor): Record<AbilityKey, number> | null {
    const abilities = raw.system.abilities;
    if (abilities === undefined) {
      return null;
    }

    const result: Partial<Record<AbilityKey, number>> = {};
    for (const key of ABILITY_KEYS) {
      const ability = abilities[key];
      if (
        ability === undefined ||
        typeof ability.value !== 'number' ||
        !Number.isFinite(ability.value)
      ) {
        return null;
      }
      result[key] = ability.value;
    }

    return result as Record<AbilityKey, number>;
  }
}
