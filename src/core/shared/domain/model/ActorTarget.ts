import { ActorTargetRequiredError } from '@/core/shared/domain/errors/actorTargetErrors';

/**
 * How a command addresses an actor: a world actor by id, or the actor of one
 * token — the synthetic actor of an unlinked token, the world actor of a linked
 * one. The token form reaches one goblin out of five that share an actor.
 */
export type ActorTarget =
  | { readonly kind: 'actor'; readonly actorId: string }
  | { readonly kind: 'token'; readonly tokenId: string; readonly sceneId: string | undefined };

export interface ActorAddress {
  readonly actorId?: string | undefined;
  readonly tokenId?: string | undefined;
  /** The token's scene; the active scene when omitted. It means nothing without a token id. */
  readonly sceneId?: string | undefined;
}

/** A token id wins over an actor id. */
export function toActorTarget(address: ActorAddress): ActorTarget {
  if (address.tokenId !== undefined) {
    return { kind: 'token', tokenId: address.tokenId, sceneId: address.sceneId };
  }
  if (address.actorId !== undefined) {
    return { kind: 'actor', actorId: address.actorId };
  }
  throw new ActorTargetRequiredError();
}

/** Where the actor document a target resolved to lives. */
export type ActorRef =
  | { readonly kind: 'world'; readonly actorId: string }
  | { readonly kind: 'token'; readonly sceneId: string; readonly tokenId: string };

export interface ActorIdentity {
  readonly id: string;
  readonly name: string;
}

/**
 * A resolved target. `id` and `name` are the document's own: a token's actor
 * carries the id of the world actor it was placed from.
 */
export interface LocatedActor extends ActorIdentity {
  readonly ref: ActorRef;
}

/** The token the actor was reached through, when it was. */
export function targetTokenId(actor: LocatedActor): string | undefined {
  return actor.ref.kind === 'token' ? actor.ref.tokenId : undefined;
}
