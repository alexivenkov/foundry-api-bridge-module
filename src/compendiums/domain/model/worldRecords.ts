export interface ImportedWorldDocument {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
}

export interface CreatedWorldDocumentView {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly type: string;
  readonly img: string;
  readonly folderName: string | null;
}

export type CreatedActorView = CreatedWorldDocumentView;

export type CreatedItemView = CreatedWorldDocumentView;

export interface ActorRef {
  readonly id: string;
  readonly name: string;
}

export interface EmbeddedItemRecord {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly img: string;
}
