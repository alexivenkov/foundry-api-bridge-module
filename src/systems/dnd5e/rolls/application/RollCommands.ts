export interface RollSkillCommand {
  readonly actorId: string;
  readonly skill: string;
  readonly showInChat: boolean;
}

export interface RollAbilityCommand {
  readonly actorId: string;
  readonly ability: string;
  readonly showInChat: boolean;
}

export interface RollSaveCommand {
  readonly actorId: string;
  readonly ability: string;
  readonly showInChat: boolean;
}

export interface RollPerceptionCommand {
  readonly actorId: string;
  readonly showInChat: boolean;
}
