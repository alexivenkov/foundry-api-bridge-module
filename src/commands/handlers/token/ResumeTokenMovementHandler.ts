import type { ResumeTokenMovementParams, ResumeTokenMovementResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenCoreMovementService,
  resumeTokenMovementRequestSchema,
  toResumeTokenMovementCommand
} from '@/core/tokens';
import { toWireMovementSnapshot, type TokenMovementHandlerDependencies } from './tokenMovementWireMappers';

export function createResumeTokenMovementHandler(
  deps: TokenMovementHandlerDependencies = {}
): (params: ResumeTokenMovementParams) => Promise<ResumeTokenMovementResult> {
  const service = createFoundryTokenCoreMovementService(deps);

  return function resumeTokenMovementHandler(params: ResumeTokenMovementParams): Promise<ResumeTokenMovementResult> {
    try {
      const result = service.resume(toResumeTokenMovementCommand(parseRequest(resumeTokenMovementRequestSchema, params)));
      return Promise.resolve({ ...toWireMovementSnapshot(result), requested: true });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const resumeTokenMovementHandler = createResumeTokenMovementHandler();
