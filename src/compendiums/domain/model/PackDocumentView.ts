export interface EmbeddedItemView {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly img: string;
  readonly system: Record<string, unknown>;
}

export interface EmbeddedPageView {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly text: string | null;
  readonly markdown: string | null;
  readonly enrichedText: null;
  readonly src: string | null;
}

export interface PackDocumentView {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly type: string;
  readonly img: string;
  readonly system?: Record<string, unknown>;
  readonly items?: readonly EmbeddedItemView[];
  readonly pages?: readonly EmbeddedPageView[];
}
