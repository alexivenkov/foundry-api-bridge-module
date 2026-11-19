/** Hit points, plus vigor and wounds when the Wounds & Vigor variant rule tracks the actor. */
export interface Pf1HealthState {
  readonly hp: {
    readonly value: number;
    readonly max: number;
    readonly temp: number;
    readonly nonlethal: number;
  };
  /** Only when the Wounds & Vigor variant rule tracks the actor. */
  readonly vigor?: { readonly value: number; readonly max: number; readonly temp: number };
  readonly wounds?: { readonly value: number; readonly max: number };
}
