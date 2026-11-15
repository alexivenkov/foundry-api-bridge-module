import type { SimulateRollParams, SimulateRollResult } from '@/commands/types';
import { createFoundryDiceService, simulateRollRequestSchema, toSimulateRollQuery } from '@/core/chat';
import { parseRequest } from '@/core/shared';
import { toWireRollSimulation, type DiceHandlerDependencies } from './chatWireMappers';

export function createSimulateRollHandler(
  deps: DiceHandlerDependencies = {}
): (params: SimulateRollParams) => Promise<SimulateRollResult> {
  const service = createFoundryDiceService(deps.globals);

  return async function simulateRollHandler(params: SimulateRollParams): Promise<SimulateRollResult> {
    const query = toSimulateRollQuery(parseRequest(simulateRollRequestSchema, params));
    return toWireRollSimulation(await service.simulate(query));
  };
}

export const simulateRollHandler = createSimulateRollHandler();
