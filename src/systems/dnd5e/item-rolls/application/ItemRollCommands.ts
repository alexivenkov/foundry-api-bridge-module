export interface RollAttackCommand {
  readonly actorId: string;
  readonly itemId: string;
  readonly advantage: boolean;
  readonly disadvantage: boolean;
  readonly showInChat: boolean;
}

export interface RollDamageCommand {
  readonly actorId: string;
  readonly itemId: string;
  readonly critical: boolean;
  readonly showInChat: boolean;
}
