export interface WorldModule {
  readonly id: string;
  readonly title: string;
  readonly version: string;
}

export interface WorldUserPresence {
  readonly id: string;
  readonly name: string;
  readonly isGM: boolean;
  readonly active: boolean;
}

export interface WorldSceneRef {
  readonly id: string;
  readonly name: string;
}

/** What is going on in the world right now. A value the game does not know yet is null. */
export interface WorldSession {
  /** Active modules only. */
  readonly modules: readonly WorldModule[];
  readonly activeScene: WorldSceneRef | null;
  readonly users: readonly WorldUserPresence[];
  readonly paused: boolean | null;
  readonly worldTime: number | null;
}
