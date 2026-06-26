export interface UseConsumableCommand {
  readonly actorId: string;
  readonly itemId: string;
  readonly quantity: number;
}

export interface CastSpellCommand {
  readonly actorId: string;
  readonly spellId: string;
  readonly rank: number | undefined;
  readonly showInChat: boolean;
}

export interface PostItemCommand {
  readonly actorId: string;
  readonly itemId: string;
  readonly showInChat: boolean;
}
