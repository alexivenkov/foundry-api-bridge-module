import { foundryGeneration } from '@/compat/foundryVersion';
import type {
  Combat,
  CombatDraft,
  Combatant,
  CombatantChanges,
  CombatantDraft,
  InitiativeRollOptions,
  TurnOverview
} from '@/core/combat/domain';
import type {
  FoundryCombatDocument,
  FoundryCombatantDocument,
  FoundryInitiativeOptions
} from './foundryCombatTypes';

export type FoundryTurnFields = Pick<FoundryCombatDocument, 'round' | 'turn' | 'combatant' | 'combatants'>;

export const COMBATANT_GROUPS_SINCE = 13;

/** The group the core put the combatant in; a stored id that names no group of the encounter is no group. */
function groupIdOf(document: FoundryCombatantDocument): string | null {
  const group = document.group;
  return typeof group === 'object' && group !== null ? group.id : null;
}

/**
 * `initiative` is the one the core sorts by: a member of a group that has an
 * initiative reads the group's.
 */
export function toCombatant(document: FoundryCombatantDocument): Combatant {
  const combatant: Combatant = {
    id: document.id,
    actorId: document.actorId,
    tokenId: document.tokenId,
    name: document.name,
    img: document.img,
    initiative: document.initiative,
    defeated: document.defeated,
    hidden: document.hidden
  };
  return foundryGeneration() >= COMBATANT_GROUPS_SINCE ? { ...combatant, groupId: groupIdOf(document) } : combatant;
}

function toCurrentCombatant(document: FoundryCombatantDocument | null | undefined): Combatant | null {
  return document ? toCombatant(document) : null;
}

export function toCombat(document: FoundryCombatDocument): Combat {
  return {
    id: document.id,
    round: document.round,
    turn: document.turn,
    started: document.started,
    turnOrder: document.turns.map(toCombatant),
    current: toCurrentCombatant(document.combatant)
  };
}

const TOKEN_SCENE_VERIFIED_SINCE = 13;

/**
 * The scene the core finds the combatant's token on (`Combatant#token`).
 * Verified on Foundry 13 and 14; an older core is not asked, and its turns are
 * described on the viewed scene.
 */
function tokenSceneIdOf(combatant: FoundryCombatantDocument | null | undefined): string | null {
  if (!combatant || foundryGeneration() < TOKEN_SCENE_VERIFIED_SINCE) {
    return null;
  }
  return combatant.token?.parent?.id ?? null;
}

export function toTurnOverview(document: FoundryTurnFields): TurnOverview {
  return {
    round: document.round,
    turn: document.turn,
    current: toCurrentCombatant(document.combatant),
    currentSceneId: tokenSceneIdOf(document.combatant),
    combatants: document.combatants.contents.map(toCombatant)
  };
}

function setIfDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

export function toFoundryCombatData(draft: CombatDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  setIfDefined(data, 'scene', draft.sceneId);
  return data;
}

export function toFoundryCombatantData(draft: CombatantDraft): Record<string, unknown> {
  const data: Record<string, unknown> = { actorId: draft.actorId };
  setIfDefined(data, 'tokenId', draft.tokenId);
  setIfDefined(data, 'sceneId', draft.sceneId);
  setIfDefined(data, 'initiative', draft.initiative);
  setIfDefined(data, 'hidden', draft.hidden);
  setIfDefined(data, 'group', draft.groupId);
  return data;
}

export function toFoundryCombatantChanges(changes: CombatantChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  setIfDefined(data, 'initiative', changes.initiative);
  setIfDefined(data, 'defeated', changes.defeated);
  setIfDefined(data, 'hidden', changes.hidden);
  setIfDefined(data, 'group', changes.groupId);
  return data;
}

/**
 * `skipDialog` keeps systems that prompt before rolling initiative headless:
 * pf1's `CombatPF#rollInitiative` otherwise opens its bonus dialog on the GM's
 * client and the command waits for a click. Core Foundry ignores the key.
 */
export function toFoundryInitiativeOptions(options: InitiativeRollOptions): FoundryInitiativeOptions {
  return options.formula !== undefined ? { formula: options.formula, skipDialog: true } : { skipDialog: true };
}
