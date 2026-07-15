// Selection over a full-pack load. Empty arrays are legal and match nothing
// (mirrors Foundry's `__in` semantics); an absent field means "no constraint".
export interface PackContentsFilter {
  readonly types?: readonly string[];
  readonly ids?: readonly string[];
}
