export interface UseItemCommand {
  readonly actorId: string;
  readonly itemId: string;
  readonly activityId: string | undefined;
  readonly activityType: string | undefined;
  readonly consume: boolean;
  readonly scaling: number | false;
  readonly showInChat: boolean;
}

export interface ActivateItemCommand {
  readonly actorId: string;
  readonly itemId: string;
  readonly activityId: string | undefined;
  readonly activityType: string | undefined;
  readonly targetTokenIds: readonly string[];
  readonly templatePosition: { x: number; y: number; direction?: number } | undefined;
  readonly spellLevel: number | undefined;
}
