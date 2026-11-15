import { z } from 'zod';
import { toActorTarget, type ActorTarget } from '@/core/shared/domain';
import { parseRequest } from './parseRequest';

/**
 * The request fields that address an actor. They are left untyped on purpose:
 * the commands have always looked only at the fields their target needs — a
 * token id makes `actorId` irrelevant, and `sceneId` counts only next to a
 * token id — so a stray value in an unused one must not fail the request.
 * `readActorTarget` checks the ones that are used.
 */
export const actorTargetRequestShape = {
  actorId: z.unknown().optional(),
  tokenId: z.unknown().optional(),
  sceneId: z.unknown().optional()
};

export interface ActorTargetRequest {
  actorId?: unknown;
  tokenId?: unknown;
  sceneId?: unknown;
}

const tokenTargetSchema = z.object({ tokenId: z.string(), sceneId: z.string().optional() });
const actorTargetSchema = z.object({ actorId: z.string().optional() });

export function readActorTarget(request: ActorTargetRequest): ActorTarget {
  return toActorTarget(
    request.tokenId !== undefined
      ? parseRequest(tokenTargetSchema, request)
      : parseRequest(actorTargetSchema, request)
  );
}
