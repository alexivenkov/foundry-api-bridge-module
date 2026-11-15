import type {
  CombatResult,
  CombatTurnContext,
  CombatantResult,
  InitiativeRollResult,
  NearbyTokenInfo,
  TurnCombatantInfo
} from '@/commands/types';
import type {
  BattlefieldToken,
  Combat,
  Combatant,
  InitiativeScore,
  NearbyToken,
  TurnContext
} from '@/core/combat';

/** `groupId` is left out, not null, on cores without combatant groups. */
export function toWireCombatant(combatant: Combatant): CombatantResult {
  const result: CombatantResult = {
    id: combatant.id,
    actorId: combatant.actorId,
    tokenId: combatant.tokenId,
    name: combatant.name,
    img: combatant.img,
    initiative: combatant.initiative,
    defeated: combatant.defeated,
    hidden: combatant.hidden
  };
  if (combatant.groupId !== undefined) {
    result.groupId = combatant.groupId;
  }
  return result;
}

export function toWireCombat(combat: Combat): CombatResult {
  return {
    id: combat.id,
    round: combat.round,
    turn: combat.turn,
    started: combat.started,
    combatants: combat.turnOrder.map(toWireCombatant),
    current: combat.current ? toWireCombatant(combat.current) : null
  };
}

export function toWireInitiativeRolls(scores: readonly InitiativeScore[]): InitiativeRollResult {
  return {
    results: scores.map((score) => ({
      combatantId: score.combatantId,
      name: score.name,
      initiative: score.initiative
    }))
  };
}

// `hp` and `ac` are left out, not null, when the actor's system does not expose them.
function addVitals(info: TurnCombatantInfo | NearbyTokenInfo, token: BattlefieldToken): void {
  const { hp, ac } = token.vitals;
  if (hp) {
    info.hp = { value: hp.value, max: hp.max };
  }
  if (ac !== null) {
    info.ac = ac;
  }
}

function toWireCurrentCombatant({ combatant, token, cell }: TurnContext['current']): TurnCombatantInfo {
  const info: TurnCombatantInfo = {
    id: combatant.id,
    actorId: combatant.actorId,
    tokenId: token.id,
    name: combatant.name,
    gridX: cell.column,
    gridY: cell.row,
    conditions: [...token.statuses]
  };
  addVitals(info, token);
  return info;
}

/** `distanceFt` is in the units of the scene grid, whatever they are: the name is part of the wire contract. */
function toWireNearbyToken({ token, cell, distance, lineOfSight }: NearbyToken): NearbyTokenInfo {
  const info: NearbyTokenInfo = {
    tokenId: token.id,
    actorId: token.actorId,
    name: token.name,
    gridX: cell.column,
    gridY: cell.row,
    distanceFt: distance,
    disposition: token.disposition,
    lineOfSight,
    conditions: [...token.statuses]
  };
  addVitals(info, token);
  return info;
}

export function toWireTurnContext(context: TurnContext): CombatTurnContext {
  return {
    round: context.round,
    turn: context.turn,
    currentCombatant: toWireCurrentCombatant(context.current),
    nearbyTokens: context.nearby.map(toWireNearbyToken),
    asciiMap: context.asciiMap
  };
}
