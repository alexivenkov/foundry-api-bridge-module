/**
 * Resolves the actor a command addresses: by `actorId` (a world actor) or by
 * `tokenId` (the token's actor — the synthetic actor of an unlinked token, or
 * the world actor of a linked one). Lets callers act on one goblin out of five
 * that share an actor.
 */
export interface ActorTargetParams {
  actorId?: string | undefined;
  tokenId?: string | undefined;
  sceneId?: string | undefined;
}

export interface TokenWithActor<A> {
  id: string;
  actor: A | null;
}

export interface SceneWithTokens<A> {
  id: string;
  tokens: { get(id: string): TokenWithActor<A> | undefined };
}

export interface ActorTargetGame<A> {
  actors: { get(id: string): A | undefined };
  scenes: {
    get(id: string): SceneWithTokens<A> | undefined;
    active: SceneWithTokens<A> | null;
  };
}

export interface ResolvedActorTarget<A> {
  actor: A;
  tokenId?: string;
}

export function resolveActorTarget<A>(
  game: ActorTargetGame<A>,
  params: ActorTargetParams
): ResolvedActorTarget<A> {
  if (params.tokenId !== undefined) {
    const scene = params.sceneId !== undefined ? game.scenes.get(params.sceneId) : game.scenes.active;
    if (!scene) {
      throw new Error(params.sceneId !== undefined ? `Scene not found: ${params.sceneId}` : 'No active scene');
    }
    const token = scene.tokens.get(params.tokenId);
    if (!token) {
      throw new Error(`Token not found: ${params.tokenId}`);
    }
    if (!token.actor) {
      throw new Error(`Token has no actor: ${params.tokenId}`);
    }
    return { actor: token.actor, tokenId: token.id };
  }

  if (params.actorId !== undefined) {
    const actor = game.actors.get(params.actorId);
    if (!actor) {
      throw new Error(`Actor not found: ${params.actorId}`);
    }
    return { actor };
  }

  throw new Error('Either actorId or tokenId is required');
}
