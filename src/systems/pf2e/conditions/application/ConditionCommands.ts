export interface SetConditionCommand {
  readonly actorId: string;
  readonly slug: string;
  readonly value: number | undefined;
}

export interface ConditionSlugCommand {
  readonly actorId: string;
  readonly slug: string;
}

export interface GetConditionsCommand {
  readonly actorId: string;
}
