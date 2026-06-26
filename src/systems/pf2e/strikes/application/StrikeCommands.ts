export interface ListStrikesCommand {
  readonly actorId: string;
}

export interface RollStrikeCommand {
  readonly actorId: string;
  readonly slug: string;
  readonly mapIncrease: number;
  readonly showInChat: boolean;
}

export interface RollStrikeDamageCommand {
  readonly actorId: string;
  readonly slug: string;
  readonly critical: boolean;
  readonly showInChat: boolean;
}
