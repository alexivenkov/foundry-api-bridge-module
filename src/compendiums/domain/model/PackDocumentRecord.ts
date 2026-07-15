export interface PackDocumentRecord {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly type: string;
  readonly img: string | null;
  readonly data: Record<string, unknown>;
}
