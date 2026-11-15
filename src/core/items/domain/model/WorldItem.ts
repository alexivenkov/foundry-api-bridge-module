/** Game-system data of a document. The core carries it between the caller and Foundry and never looks inside. */
export type SystemData = Readonly<Record<string, unknown>>;

/** A world item without its game-system data. */
export interface WorldItem {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly type: string;
  /** null when the item has no image. */
  readonly img: string | null;
  readonly folderName: string | null;
}

export interface WorldItemDetails extends WorldItem {
  readonly system: SystemData;
}

/**
 * The attributes a caller may set. Omitted ones are left to the core default
 * (create) or untouched (update); `null` clears the image or moves the item
 * out of its folder.
 */
export interface WorldItemChanges {
  readonly name?: string | undefined;
  readonly img?: string | null | undefined;
  readonly folderId?: string | null | undefined;
  readonly system?: SystemData | undefined;
  /** The position in its folder of the Items directory. */
  readonly sort?: number | undefined;
}

export interface WorldItemDraft extends WorldItemChanges {
  readonly name: string;
  readonly type: string;
}
