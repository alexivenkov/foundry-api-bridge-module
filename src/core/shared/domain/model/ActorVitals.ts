/** An actor's hit points and armor class, when its game system exposes them where the core expects. */
export interface ActorVitals {
  readonly hp: { readonly value: number; readonly max: number } | null;
  readonly ac: number | null;
}

export const NO_VITALS: ActorVitals = { hp: null, ac: null };
