import { ValidationError } from '@/kernel';
import { emptyAsAbsent } from '@/core/shared';
import type {
  AddCombatantCommand,
  CombatAddress,
  CombatantAddress,
  CreateCombatCommand,
  RollAllInitiativeCommand,
  RollInitiativeCommand,
  SetCombatantDefeatedCommand,
  SetInitiativeCommand,
  SetTurnCommand,
  UpdateCombatantCommand
} from '@/core/combat/application';
import type {
  AddCombatantRequest,
  CombatAddressRequest,
  CombatantAddressRequest,
  CreateCombatRequest,
  RollAllInitiativeRequest,
  RollInitiativeRequest,
  SetCombatantDefeatedRequest,
  SetInitiativeRequest,
  UpdateCombatantRequest
} from './combatSchemas';

export function toCombatAddress(request: CombatAddressRequest): CombatAddress {
  return { combatId: emptyAsAbsent(request.combatId) };
}

/** Unlike `combatId`, an empty or null `sceneId` is not "the active scene": it goes to the core as given. */
export function toCreateCombatCommand(request: CreateCombatRequest): CreateCombatCommand {
  return { sceneId: request.sceneId, activate: Boolean(request.activate) };
}

export function toCombatantAddress(request: CombatantAddressRequest): CombatantAddress {
  return { combatId: emptyAsAbsent(request.combatId), combatantId: request.combatantId };
}

export function toSetTurnCommand(request: CombatantAddressRequest): SetTurnCommand {
  return toCombatantAddress(request);
}

/**
 * Without `actorId`, or with a scene, the token is the combatant to look up;
 * otherwise the ids go to the core as given, as they always have.
 */
export function toAddCombatantCommand(request: AddCombatantRequest): AddCombatantCommand {
  const combatId = emptyAsAbsent(request.combatId);
  const sceneId = emptyAsAbsent(request.sceneId);
  const groupId = request.groupId ?? undefined;
  const tokenId = request.tokenId ?? undefined;

  if (tokenId !== undefined && tokenId !== '' && (request.actorId === undefined || sceneId !== undefined)) {
    return {
      combatId,
      token: {
        tokenId,
        sceneId,
        actorId: request.actorId,
        initiative: request.initiative,
        hidden: request.hidden,
        groupId
      }
    };
  }
  if (request.actorId === undefined) {
    throw new ValidationError('actorId: actorId or tokenId is required');
  }
  return {
    combatId,
    draft: {
      actorId: request.actorId,
      tokenId: request.tokenId,
      initiative: request.initiative,
      hidden: request.hidden,
      groupId
    }
  };
}

/** A change may come at the top level or inside the REST API's `updates` envelope; the top level wins. */
export function toUpdateCombatantCommand(request: UpdateCombatantRequest): UpdateCombatantCommand {
  const envelope = request.updates;
  return {
    combatId: emptyAsAbsent(request.combatId),
    combatantId: request.combatantId,
    changes: {
      initiative: request.initiative !== undefined ? request.initiative : envelope?.initiative,
      defeated: request.defeated ?? envelope?.defeated,
      hidden: request.hidden ?? envelope?.hidden,
      groupId: request.groupId
    }
  };
}

export function toSetCombatantDefeatedCommand(request: SetCombatantDefeatedRequest): SetCombatantDefeatedCommand {
  return {
    combatId: emptyAsAbsent(request.combatId),
    combatantId: request.combatantId,
    defeated: request.defeated
  };
}

export function toSetInitiativeCommand(request: SetInitiativeRequest): SetInitiativeCommand {
  return {
    combatId: emptyAsAbsent(request.combatId),
    combatantId: request.combatantId,
    initiative: request.initiative
  };
}

export function toRollInitiativeCommand(request: RollInitiativeRequest): RollInitiativeCommand {
  return {
    combatId: emptyAsAbsent(request.combatId),
    combatantIds: request.combatantIds,
    options: { formula: request.formula }
  };
}

export function toRollAllInitiativeCommand(request: RollAllInitiativeRequest): RollAllInitiativeCommand {
  return {
    combatId: emptyAsAbsent(request.combatId),
    npcsOnly: Boolean(request.npcsOnly),
    options: { formula: request.formula }
  };
}
