/** What the running Foundry generation stores on a note. */
export interface NoteFeatures {
  /** `locked` and `levels` (Foundry 14+). */
  readonly levels: boolean;
}

export interface NoteEnvironment {
  features(): NoteFeatures;
  /** The ids of the scene's levels; empty where the core has no levels. */
  listSceneLevelIds(sceneId: string): readonly string[];
}
