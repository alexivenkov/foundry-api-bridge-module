/** An image or video shown to players in a popout. */
export interface SharedImage {
  readonly src: string;
  readonly title?: string | undefined;
  readonly caption?: string | undefined;
  /** User ids; empty sends it to every connected user. */
  readonly users: readonly string[];
}

/** A map note of a journal on the scene the GM's canvas shows. */
export interface JournalSceneNote {
  readonly noteId: string;
  readonly sceneId: string;
  readonly x: number;
  readonly y: number;
}

export interface NotePanView {
  readonly scale?: number | undefined;
  /** Milliseconds. */
  readonly duration?: number | undefined;
}
