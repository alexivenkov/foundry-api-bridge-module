export interface ResolvedUuidRecord {
  readonly uuid: string;
  readonly documentName: string;
  readonly id: string;
  readonly name: string | null;
  readonly type: string | null;
  readonly img: string | null;
  readonly pack: string | null;
  readonly parentUuid: string | null;
  readonly data: Record<string, unknown>;
}
