export interface FoundryHitPoints {
  value: number;
  max: number;
  temp: number | null;
}

/** One entry of dnd5e's `Actor5e#applyDamage(damages)`; `type: "healing"` heals. */
export interface FoundryDamageDescription {
  value: number;
  type?: string;
}

export interface FoundryHitPointsActor {
  id: string;
  name: string;
  system: { attributes?: { hp?: FoundryHitPoints } };
  applyDamage(damages: FoundryDamageDescription[], options?: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryHitPointsToken {
  id: string;
  actor: FoundryHitPointsActor | null;
}

export interface FoundryHitPointsScene {
  id: string;
  tokens: { get(id: string): FoundryHitPointsToken | undefined };
}

export interface FoundryHitPointsGame {
  actors: { get(id: string): FoundryHitPointsActor | undefined };
  scenes: {
    get(id: string): FoundryHitPointsScene | undefined;
    active: FoundryHitPointsScene | null;
  };
}

export function getDnd5eHitPointsGame(): FoundryHitPointsGame {
  return (globalThis as unknown as { game: FoundryHitPointsGame }).game;
}
