/** The actor a CoC7 command addresses: a world actor, or one token's actor. */
export interface Coc7ActorTarget {
  readonly actorId: string | undefined;
  readonly tokenId: string | undefined;
  readonly sceneId: string | undefined;
}
