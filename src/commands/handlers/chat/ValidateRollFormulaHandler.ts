import type { ValidateRollFormulaParams, ValidateRollFormulaResult } from '@/commands/types';
import { createFoundryDiceService, toValidateRollFormulaQuery, validateRollFormulaRequestSchema } from '@/core/chat';
import { parseRequest } from '@/core/shared';
import { toWireRollFormulaVerdict, type DiceHandlerDependencies } from './chatWireMappers';

export function createValidateRollFormulaHandler(
  deps: DiceHandlerDependencies = {}
): (params: ValidateRollFormulaParams) => Promise<ValidateRollFormulaResult> {
  const service = createFoundryDiceService(deps.globals);

  return function validateRollFormulaHandler(params: ValidateRollFormulaParams): Promise<ValidateRollFormulaResult> {
    const query = toValidateRollFormulaQuery(parseRequest(validateRollFormulaRequestSchema, params));
    return Promise.resolve(toWireRollFormulaVerdict(service.validate(query)));
  };
}

export const validateRollFormulaHandler = createValidateRollFormulaHandler();
