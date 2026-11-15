/** The actor a PF1 command addresses: a world actor, or one token's actor. */
export interface Pf1ActorTarget {
  readonly actorId: string | undefined;
  readonly tokenId: string | undefined;
  readonly sceneId: string | undefined;
}
