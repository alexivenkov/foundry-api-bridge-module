import {
  textPreview,
  type ActorChangePayload,
  type ActorUpdatedPayload,
  type ChatMessageCreatedPayload,
  type CombatantRef,
  type CombatEndedPayload,
  type CombatStatePayload,
  type GameEventOccurrence,
  type ItemChangePayload,
  type ItemRef,
  type ItemUpdatedPayload,
  type JournalChangePayload,
  type JournalPageChangeKind,
  type JournalUpdatedPayload,
  type SceneChangePayload,
  type SceneRef,
  type SceneUpdatedPayload,
  type TargetsChangedPayload,
  type TokenCreatedPayload,
  type TokenDeletedPayload,
  type TokenMovedPayload,
  type TokenRef,
  type TokenUpdatedPayload,
  type UserConnectionPayload
} from '@/core/events/domain';
import type {
  FoundryActorLike,
  FoundryChatMessageLike,
  FoundryCombatantLike,
  FoundryCombatLike,
  FoundryDocumentLike,
  FoundryTokenDocumentLike,
  FoundryTokenPlaceableLike,
  FoundryUserLike
} from './foundryEventTypes';

/** Token keys whose change is a move (`level`: Foundry 14+). Reported by `token-moved`, not `token-updated`. */
const TOKEN_POSITION_KEYS: ReadonlySet<string> = new Set(['x', 'y', 'elevation', 'level']);
const SCENE_ACTIVATION_KEYS: ReadonlySet<string> = new Set(['active']);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/** A display string (name, type, alias); anything that is not a string reads as empty. */
function label(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function finiteOr<T>(value: unknown, fallback: T): number | T {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A hook's `userId` argument. */
export function userIdOf(value: unknown): string | null {
  return text(value);
}

/**
 * The document as a structural view, or null for a compendium document or a
 * non-object. Every field of the specific views is optional, so this view
 * can be read as any of them.
 */
export function worldDocument(value: unknown): FoundryDocumentLike | null {
  if (!isRecord(value)) {
    return null;
  }
  const document = value as FoundryDocumentLike;
  return text(document.pack) === null ? document : null;
}

/**
 * The changed top-level keys of an update hook's `changed` (the diff the core
 * computed), sorted. Internal keys (`_id`, `_stats`, `_movementHistory`,
 * `_regions`) are left out.
 */
export function changedKeysOf(changed: unknown, excluded: ReadonlySet<string> = new Set()): string[] {
  if (!isRecord(changed)) {
    return [];
  }
  return Object.keys(changed)
    .filter((key) => !key.startsWith('_') && !excluded.has(key))
    .sort();
}

function hasAnyKey(changed: unknown, keys: ReadonlySet<string>): boolean {
  return isRecord(changed) && Object.keys(changed).some((key) => keys.has(key));
}

// ── Tokens ──────────────────────────────────────────────────────────────────

function toTokenRef(token: FoundryTokenDocumentLike): TokenRef | null {
  const tokenId = text(token.id);
  if (tokenId === null) {
    return null;
  }
  return {
    tokenId,
    sceneId: text(token.parent?.id),
    name: label(token.name),
    actorId: text(token.actorId)
  };
}

export function toTokenCreated(token: FoundryTokenDocumentLike, userId: string | null): TokenCreatedPayload | null {
  const ref = toTokenRef(token);
  if (ref === null) {
    return null;
  }
  return {
    ...ref,
    x: finiteOr(token.x, 0),
    y: finiteOr(token.y, 0),
    elevation: finiteOr(token.elevation, 0),
    hidden: token.hidden === true,
    userId
  };
}

export function isTokenMove(changed: unknown): boolean {
  return hasAnyKey(changed, TOKEN_POSITION_KEYS);
}

export function toTokenMoved(token: FoundryTokenDocumentLike, userId: string | null): TokenMovedPayload | null {
  const ref = toTokenRef(token);
  if (ref === null) {
    return null;
  }
  const level = text(token._source?.level);
  return {
    ...ref,
    x: finiteOr(token.x, 0),
    y: finiteOr(token.y, 0),
    elevation: finiteOr(token.elevation, 0),
    ...(level !== null ? { level } : {}),
    userId
  };
}

/** Null when only the position (or only internal keys) changed. */
export function toTokenUpdated(
  token: FoundryTokenDocumentLike,
  changed: unknown,
  userId: string | null
): TokenUpdatedPayload | null {
  const ref = toTokenRef(token);
  const changedKeys = changedKeysOf(changed, TOKEN_POSITION_KEYS);
  return ref !== null && changedKeys.length > 0 ? { ...ref, changedKeys, userId } : null;
}

export function toTokenDeleted(token: FoundryTokenDocumentLike, userId: string | null): TokenDeletedPayload | null {
  const ref = toTokenRef(token);
  return ref !== null ? { ...ref, userId } : null;
}

// ── Combat ──────────────────────────────────────────────────────────────────

function toCombatantRef(combatant: FoundryCombatantLike | null | undefined): CombatantRef | null {
  const combatantId = text(combatant?.id);
  if (combatant === null || combatant === undefined || combatantId === null) {
    return null;
  }
  return {
    combatantId,
    name: label(combatant.name),
    actorId: text(combatant.actorId),
    tokenId: text(combatant.tokenId)
  };
}

function toCombatState(combat: FoundryCombatLike, userId: string | null): CombatStatePayload | null {
  const combatId = text(combat.id);
  if (combatId === null) {
    return null;
  }
  return {
    combatId,
    sceneId: text(combat._source?.scene),
    round: finiteOr(combat.round, 0),
    turn: finiteOr(combat.turn, null),
    combatant: toCombatantRef(combat.combatant),
    userId
  };
}

/**
 * `updateCombat` runs on every client after the change, unlike `combatStart` /
 * `combatRound` / `combatTurn`, which run before it and only on the client that
 * asked. The diff holds `round` / `turn` only when they changed; the state
 * before is `Combat#previous`, which the core records before the hook runs.
 */
export function toCombatChange(
  combat: FoundryCombatLike,
  changed: unknown,
  userId: string | null
): GameEventOccurrence | null {
  if (!isRecord(changed) || (!('round' in changed) && !('turn' in changed))) {
    return null;
  }
  const state = toCombatState(combat, userId);
  if (state === null) {
    return null;
  }
  const previousRound = finiteOr(combat.previous?.round, null);
  if (state.round > 0 && previousRound === 0) {
    return { name: 'combat-started', data: state };
  }
  if ('round' in changed) {
    return { name: 'combat-round-changed', data: { ...state, previousRound } };
  }
  return {
    name: 'combat-turn-changed',
    data: {
      ...state,
      previousTurn: finiteOr(combat.previous?.turn, null),
      previousCombatantId: text(combat.previous?.combatantId)
    }
  };
}

export function toCombatEnded(combat: FoundryCombatLike, userId: string | null): CombatEndedPayload | null {
  const combatId = text(combat.id);
  if (combatId === null) {
    return null;
  }
  return { combatId, sceneId: text(combat._source?.scene), round: finiteOr(combat.round, 0), userId };
}

// ── Actors and items ────────────────────────────────────────────────────────

export function toActorChange(actor: FoundryActorLike, userId: string | null): ActorChangePayload | null {
  const actorId = text(actor.id);
  return actorId !== null ? { actorId, name: label(actor.name), type: label(actor.type), userId } : null;
}

/** Also the synthetic actor of an unlinked token, which the core reports through `updateActor`. */
export function toActorUpdated(actor: FoundryActorLike, changed: unknown, userId: string | null): ActorUpdatedPayload | null {
  const base = toActorChange(actor, userId);
  const changedKeys = changedKeysOf(changed);
  if (base === null || changedKeys.length === 0) {
    return null;
  }
  const token = actor.isToken === true ? actor.token : null;
  return { ...base, tokenId: text(token?.id), sceneId: text(token?.parent?.id), changedKeys };
}

/**
 * An owned item's parent is the Actor; an item of an unlinked token lives in
 * the token's ActorDelta, whose parent is the TokenDocument.
 */
function ownerOf(item: FoundryDocumentLike): { actorId: string | null; tokenId: string | null } {
  const parent = item.parent;
  if (parent?.documentName === 'Actor') {
    const actor = parent as FoundryActorLike;
    return { actorId: text(actor.id), tokenId: actor.isToken === true ? text(actor.token?.id) : null };
  }
  if (parent?.documentName === 'ActorDelta') {
    const token = (parent.parent ?? null) as FoundryTokenDocumentLike | null;
    return { actorId: text(token?.actorId), tokenId: text(token?.id) };
  }
  return { actorId: null, tokenId: null };
}

function toItemRef(item: FoundryDocumentLike): ItemRef | null {
  const itemId = text(item.id);
  return itemId !== null ? { itemId, name: label(item.name), type: label(item.type), ...ownerOf(item) } : null;
}

export function toItemChange(item: FoundryDocumentLike, userId: string | null): ItemChangePayload | null {
  const ref = toItemRef(item);
  return ref !== null ? { ...ref, userId } : null;
}

export function toItemUpdated(item: FoundryDocumentLike, changed: unknown, userId: string | null): ItemUpdatedPayload | null {
  const ref = toItemRef(item);
  const changedKeys = changedKeysOf(changed);
  return ref !== null && changedKeys.length > 0 ? { ...ref, changedKeys, userId } : null;
}

// ── Journals ────────────────────────────────────────────────────────────────

export function toJournalChange(entry: FoundryDocumentLike, userId: string | null): JournalChangePayload | null {
  const journalId = text(entry.id);
  return journalId !== null ? { journalId, name: label(entry.name), userId } : null;
}

export function toJournalUpdated(entry: FoundryDocumentLike, changed: unknown, userId: string | null): JournalUpdatedPayload | null {
  const base = toJournalChange(entry, userId);
  const changedKeys = changedKeysOf(changed);
  return base !== null && changedKeys.length > 0 ? { ...base, changedKeys, page: null } : null;
}

export function toJournalPageChange(
  page: FoundryDocumentLike,
  change: JournalPageChangeKind,
  changed: unknown,
  userId: string | null
): JournalUpdatedPayload | null {
  const entry = page.parent ?? null;
  const journalId = text(entry?.id);
  const pageId = text(page.id);
  const pageKeys = change === 'updated' ? changedKeysOf(changed) : [];
  if (journalId === null || pageId === null || (change === 'updated' && pageKeys.length === 0)) {
    return null;
  }
  return {
    journalId,
    name: label(entry?.name),
    changedKeys: ['pages'],
    page: { pageId, name: label(page.name), change, changedKeys: pageKeys },
    userId
  };
}

// ── Scenes ──────────────────────────────────────────────────────────────────

export function toSceneRef(scene: FoundryDocumentLike | null | undefined): SceneRef | null {
  const sceneId = text(scene?.id);
  return sceneId !== null ? { sceneId, name: label(scene?.name) } : null;
}

export function toSceneChange(scene: FoundryDocumentLike, userId: string | null): SceneChangePayload | null {
  const ref = toSceneRef(scene);
  return ref !== null ? { ...ref, userId } : null;
}

export function isSceneActivation(changed: unknown): boolean {
  return isRecord(changed) && changed['active'] === true;
}

/** `active` is left to `scene-activated`; null when nothing else changed. */
export function toSceneUpdated(scene: FoundryDocumentLike, changed: unknown, userId: string | null): SceneUpdatedPayload | null {
  const ref = toSceneRef(scene);
  const changedKeys = changedKeysOf(changed, SCENE_ACTIVATION_KEYS);
  return ref !== null && changedKeys.length > 0 ? { ...ref, changedKeys, userId } : null;
}

// ── Chat, users, targets ────────────────────────────────────────────────────

/** Read from `_source`: the stored author id, whisper ids and serialized rolls, never the live objects. */
export function toChatMessageCreated(message: FoundryChatMessageLike): ChatMessageCreatedPayload | null {
  const messageId = text(message.id);
  if (messageId === null) {
    return null;
  }
  const source = message._source ?? {};
  const speaker = source.speaker ?? {};
  const content = textPreview(label(source.content));
  return {
    messageId,
    authorId: text(source.author) ?? text(source.user),
    speaker: {
      alias: label(speaker.alias),
      actorId: text(speaker.actor),
      tokenId: text(speaker.token),
      sceneId: text(speaker.scene)
    },
    whisper: (source.whisper ?? []).filter((id): id is string => typeof id === 'string'),
    blind: source.blind === true,
    hasRolls: (source.rolls?.length ?? 0) > 0,
    preview: content !== '' ? content : textPreview(label(source.flavor))
  };
}

export function toUserConnection(user: FoundryUserLike): UserConnectionPayload | null {
  const userId = text(user.id);
  return userId !== null ? { userId, name: label(user.name), isGM: user.isGM === true } : null;
}

export function toTargetsChanged(user: FoundryUserLike, token: FoundryTokenPlaceableLike | null): TargetsChangedPayload | null {
  const userId = text(user.id);
  if (userId === null) {
    return null;
  }
  return {
    userId,
    userName: label(user.name),
    sceneId: text(token?.document?.parent?.id),
    tokenIds: [...(user.targets?.ids ?? [])]
  };
}
