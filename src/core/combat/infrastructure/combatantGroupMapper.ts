import type { CombatantGroup, CombatantGroupChanges, CombatantGroupDraft } from '@/core/combat/domain';
import type { FoundryCombatantGroupDocument } from './foundryCombatantGroupTypes';

export function toCombatantGroup(document: FoundryCombatantGroupDocument): CombatantGroup {
  return {
    id: document.id,
    name: document.name || null,
    img: document.img || null,
    initiative: document.initiative ?? null,
    defeated: document.defeated,
    hidden: document.hidden,
    memberIds: Array.from(document.members, (member) => member.id)
  };
}

function setIfDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

export function toFoundryGroupData(draft: CombatantGroupDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  setIfDefined(data, 'name', draft.name);
  setIfDefined(data, 'img', draft.img);
  setIfDefined(data, 'initiative', draft.initiative);
  return data;
}

/** A null name would be dropped from the document; a blank one is how "no name" is stored. */
export function toFoundryGroupChanges(changes: CombatantGroupChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  setIfDefined(data, 'name', changes.name === null ? '' : changes.name);
  setIfDefined(data, 'img', changes.img);
  setIfDefined(data, 'initiative', changes.initiative);
  return data;
}
