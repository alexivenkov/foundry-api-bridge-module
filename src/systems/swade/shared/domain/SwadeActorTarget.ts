/** The actor a SWADE command addresses: a world actor, or one token's actor. */
export interface SwadeActorTarget {
  readonly actorId: string | undefined;
  readonly tokenId: string | undefined;
  readonly sceneId: string | undefined;
}
