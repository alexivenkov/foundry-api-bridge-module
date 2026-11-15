import type { RollDiceParams, RollResult } from '@/commands/types';
import {
  createFoundryDiceService,
  rollDiceRequestSchema,
  toRollDiceCommand,
  type DiceGlobalsProvider,
  type DiceRollResult
} from '@/core/chat';
import { parseRequest } from '@/core/shared';

export interface RollDiceHandlerDependencies {
  globals?: DiceGlobalsProvider;
}

/** `isCritical` / `isFumble` are reported only when true. */
function toWireRollResult({ roll, isCritical, isFumble }: DiceRollResult): RollResult {
  const result: RollResult = {
    total: roll.total,
    formula: roll.formula,
    dice: roll.dice.map((term) => ({
      type: `d${String(term.faces)}`,
      count: term.count,
      results: term.results.map((die) => die.value)
    }))
  };

  if (isCritical) {
    result.isCritical = true;
  }
  if (isFumble) {
    result.isFumble = true;
  }

  return result;
}

export function createRollDiceHandler(
  deps: RollDiceHandlerDependencies = {}
): (params: RollDiceParams) => Promise<RollResult> {
  const service = createFoundryDiceService(deps.globals);

  return async function rollDiceHandler(params: RollDiceParams): Promise<RollResult> {
    const command = toRollDiceCommand(parseRequest(rollDiceRequestSchema, params));
    return toWireRollResult(await service.roll(command));
  };
}

export const rollDiceHandler = createRollDiceHandler();
