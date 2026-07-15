// `fields` is present only when the caller requested specific index fields;
// a requested path that does not resolve is kept as an explicit `undefined`
// value (it disappears during JSON serialization, matching the wire contract).
export interface PackIndexEntry {
  readonly id: string;
  readonly name: string;
  readonly img: string | null;
  readonly type: string | null;
  readonly fields?: Readonly<Record<string, unknown>>;
}
