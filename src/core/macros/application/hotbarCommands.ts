// `userId` undefined = the user the module runs as.

export interface GetHotbarQuery {
  readonly userId: string | undefined;
  readonly page: number | undefined;
}

export interface AssignHotbarSlotCommand {
  readonly userId: string | undefined;
  readonly macroId: string;
  /** Undefined = the first free slot. */
  readonly slot: number | undefined;
}

export interface MoveHotbarSlotCommand {
  readonly userId: string | undefined;
  readonly fromSlot: number;
  readonly toSlot: number;
}

export interface ClearHotbarSlotCommand {
  readonly userId: string | undefined;
  readonly slot: number;
}
