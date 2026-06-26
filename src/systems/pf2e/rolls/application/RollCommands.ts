export interface RollSkillCommand {
  readonly actorId: string;
  readonly skill: string;
  readonly showInChat: boolean;
}

export interface RollSaveCommand {
  readonly actorId: string;
  readonly save: string;
  readonly showInChat: boolean;
}

export interface RollPerceptionCommand {
  readonly actorId: string;
  readonly showInChat: boolean;
}
