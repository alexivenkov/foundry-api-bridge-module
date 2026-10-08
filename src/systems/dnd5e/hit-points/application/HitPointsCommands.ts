export interface ApplyDamageCommand {
  readonly actorId: string | undefined;
  readonly tokenId: string | undefined;
  readonly sceneId: string | undefined;
  readonly amount: number;
  readonly damageType: string | undefined;
}

export interface ApplyHealingCommand {
  readonly actorId: string | undefined;
  readonly tokenId: string | undefined;
  readonly sceneId: string | undefined;
  readonly amount: number;
}
