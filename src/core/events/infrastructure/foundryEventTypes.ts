// Structural views of what the Foundry hooks hand their listeners (Foundry
// 13–14 client sources). Hook arguments arrive as `unknown`; the mappers read
// them through these shapes and treat every field as possibly missing.

/** `Hooks` (client/helpers/hooks.mjs): `on` returns an id that `off` accepts. */
export interface FoundryHooks {
  on(hook: string, fn: (...args: unknown[]) => unknown): number;
  off(hook: string, fn: number): void;
}

export interface FoundryEventGlobals {
  Hooks: FoundryHooks;
}

export type EventGlobalsProvider = () => FoundryEventGlobals;

/** Any client document: `pack` is a compendium id, inherited by embedded documents; null in the world. */
export interface FoundryDocumentLike {
  id?: string | null;
  name?: string | null;
  type?: string | null;
  documentName?: string;
  pack?: string | null;
  parent?: FoundryDocumentLike | null;
}

export interface FoundryTokenDocumentLike extends FoundryDocumentLike {
  actorId?: string | null;
  x?: number;
  y?: number;
  elevation?: number;
  hidden?: boolean;
  /** `level` exists on Foundry 14+ only. */
  _source?: { level?: unknown };
}

/** A world actor, or the synthetic actor of an unlinked token (`isToken`, `token`). */
export interface FoundryActorLike extends FoundryDocumentLike {
  isToken?: boolean;
  token?: FoundryTokenDocumentLike | null;
}

export interface FoundryCombatantLike {
  id?: string | null;
  /** Prepared by the client: the stored name, else the token's or the actor's. */
  name?: string | null;
  actorId?: string | null;
  tokenId?: string | null;
}

/** `Combat#previous` / `#current` (CombatHistoryData), set before `updateCombat` runs. */
export interface FoundryCombatHistory {
  round?: number | null;
  turn?: number | null;
  combatantId?: string | null;
}

export interface FoundryCombatLike extends FoundryDocumentLike {
  round?: number;
  turn?: number | null;
  combatant?: FoundryCombatantLike | null;
  previous?: FoundryCombatHistory | null;
  _source?: { scene?: string | null };
}

export interface FoundryChatSpeakerSource {
  alias?: string | null;
  actor?: string | null;
  token?: string | null;
  scene?: string | null;
}

/** The stored ChatMessage fields; `user` is the Foundry 11 name of `author`. */
export interface FoundryChatMessageSource {
  author?: string | null;
  user?: string | null;
  speaker?: FoundryChatSpeakerSource | null;
  whisper?: readonly string[] | null;
  blind?: boolean | null;
  rolls?: readonly unknown[] | null;
  content?: string | null;
  flavor?: string | null;
}

export interface FoundryChatMessageLike extends FoundryDocumentLike {
  _source?: FoundryChatMessageSource;
}

export interface FoundryUserLike {
  id?: string | null;
  name?: string | null;
  isGM?: boolean;
  /** `UserTargets`: a Set of Token placeables with an `ids` getter. */
  targets?: { ids?: readonly string[] } | null;
}

/** A Token placeable, as `targetToken` passes it. */
export interface FoundryTokenPlaceableLike {
  id?: string | null;
  document?: FoundryTokenDocumentLike | null;
}

/** The canvas, as `canvasReady` passes it. */
export interface FoundryCanvasLike {
  scene?: FoundryDocumentLike | null;
}
