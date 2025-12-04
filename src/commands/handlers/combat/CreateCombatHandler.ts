import type { CreateCombatParams, CombatResult } from '@/commands/types';
import {
  mapCombatToResult,
  type CombatConstructor,
  type FoundryGame,
  type FoundryCombatCreateData
} from './combatTypes';

declare const game: FoundryGame;
declare const Combat: CombatConstructor;

export async function createCombatHandler(params: CreateCombatParams): Promise<CombatResult> {
  const createData: FoundryCombatCreateData = {};

  if (params.sceneId !== undefined) {
    createData.scene = params.sceneId;
  } else if (game.scenes.active) {
    createData.scene = game.scenes.active.id;
  }

  const combat = await Combat.create(createData);

  if (params.activate) {
    await combat.activate();
  }

  return mapCombatToResult(combat);
}