export interface FoundrySceneLike {
  id: string;
  name?: string;
}

export interface FoundryScenesCollection<TScene extends FoundrySceneLike> {
  get(id: string): TScene | undefined;
  /** `Scenes#active` is a `find`: with no active scene the core answers `undefined`, not `null`. */
  active: TScene | null | undefined;
}

export interface FoundryScenesGame<TScene extends FoundrySceneLike = FoundrySceneLike> {
  scenes: FoundryScenesCollection<TScene>;
}

export function findFoundryScene<TScene extends FoundrySceneLike>(
  scenes: FoundryScenesCollection<TScene>,
  sceneId: string
): TScene | undefined {
  const active = scenes.active;
  return active?.id === sceneId ? active : scenes.get(sceneId);
}
