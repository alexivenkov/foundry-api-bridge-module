/** Game-system data of a document. The core carries it between the caller and Foundry and never looks inside. */
export type SystemData = Readonly<Record<string, unknown>>;

/** An actor as the directory lists it. */
export interface ActorSummary {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  /** null when the actor has no image. */
  readonly img: string | null;
}

/** An actor document without its game-system data. */
export interface Actor extends ActorSummary {
  readonly uuid: string;
  readonly folderName: string | null;
}

export interface ActorItem {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly img: string | null;
  readonly system: SystemData;
}

/** An actor with what its sheet works from: the prepared roll data and the items it owns. */
export interface ActorDetails extends ActorSummary {
  readonly rollData: SystemData;
  readonly items: readonly ActorItem[];
}

/**
 * The attributes a caller may set. Omitted ones are left to the core default
 * (create) or untouched (update); `null` clears the folder or the image.
 */
export interface ActorChanges {
  readonly name?: string | undefined;
  readonly img?: string | null | undefined;
  readonly folderId?: string | null | undefined;
  readonly system?: SystemData | undefined;
}

export interface ActorDraft extends ActorChanges {
  readonly name: string;
  readonly type: string;
}
