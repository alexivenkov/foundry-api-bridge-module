import type { GameEventName, GameEventOccurrence, GameEventPayloads, JournalPageChangeKind } from '@/core/events/domain';
import {
  isRecord,
  isSceneActivation,
  isTokenMove,
  toActorChange,
  toActorUpdated,
  toChatMessageCreated,
  toCombatChange,
  toCombatEnded,
  toItemChange,
  toItemUpdated,
  toJournalChange,
  toJournalPageChange,
  toJournalUpdated,
  toSceneChange,
  toSceneRef,
  toSceneUpdated,
  toTargetsChanged,
  toTokenCreated,
  toTokenDeleted,
  toTokenMoved,
  toTokenUpdated,
  toUserConnection,
  userIdOf,
  worldDocument
} from './eventMappers';
import type {
  FoundryCanvasLike,
  FoundryDocumentLike,
  FoundryTokenPlaceableLike,
  FoundryUserLike
} from './foundryEventTypes';

export interface HookSourceState {
  /** The last scene `scene-viewed` reported, so a redraw of the same scene is not reported again. */
  lastViewedSceneId: string | null;
}

export interface HookContext {
  emit(event: GameEventOccurrence): void;
  readonly state: HookSourceState;
}

/** One Foundry hook and the events it feeds. */
export interface HookBinding {
  readonly hook: string;
  readonly events: readonly GameEventName[];
  handle(args: readonly unknown[], context: HookContext): void;
}

type HookHandler = HookBinding['handle'];

// Argument order, Foundry 13–14 (client/data/client-backend.mjs):
// create<Doc>(document, options, userId), update<Doc>(document, changed, options, userId),
// delete<Doc>(document, options, userId). `changed` is the diff `updateSource` returned.

function emitIf<N extends GameEventName>(context: HookContext, name: N, data: GameEventPayloads[N] | null): void {
  if (data !== null) {
    // The compiler cannot tie a generic name to its payload inside the union.
    context.emit({ name, data } as GameEventOccurrence);
  }
}

function binding(hook: string, events: readonly GameEventName[], handle: HookHandler): HookBinding {
  return { hook, events, handle };
}

function onCreateOrDelete<N extends GameEventName>(
  hook: string,
  name: N,
  map: (document: FoundryDocumentLike, userId: string | null) => GameEventPayloads[N] | null
): HookBinding {
  return binding(hook, [name], (args, context) => {
    const document = worldDocument(args[0]);
    if (document !== null) {
      emitIf(context, name, map(document, userIdOf(args[2])));
    }
  });
}

function onUpdate<N extends GameEventName>(
  hook: string,
  name: N,
  map: (document: FoundryDocumentLike, changed: unknown, userId: string | null) => GameEventPayloads[N] | null
): HookBinding {
  return binding(hook, [name], (args, context) => {
    const document = worldDocument(args[0]);
    if (document !== null) {
      emitIf(context, name, map(document, args[1], userIdOf(args[3])));
    }
  });
}

function onJournalPage(hook: string, change: JournalPageChangeKind): HookBinding {
  return binding(hook, ['journal-updated'], (args, context) => {
    const page = worldDocument(args[0]);
    const changed = change === 'updated' ? args[1] : undefined;
    const userId = userIdOf(change === 'updated' ? args[3] : args[2]);
    if (page !== null) {
      emitIf(context, 'journal-updated', toJournalPageChange(page, change, changed, userId));
    }
  });
}

const onCombatUpdate: HookHandler = (args, context) => {
  const combat = worldDocument(args[0]);
  const event = combat !== null ? toCombatChange(combat, args[1], userIdOf(args[3])) : null;
  if (event !== null) {
    context.emit(event);
  }
};

const onTokenUpdate: HookHandler = (args, context) => {
  const token = worldDocument(args[0]);
  if (token === null) {
    return;
  }
  const userId = userIdOf(args[3]);
  if (isTokenMove(args[1])) {
    emitIf(context, 'token-moved', toTokenMoved(token, userId));
  }
  emitIf(context, 'token-updated', toTokenUpdated(token, args[1], userId));
};

const onSceneUpdate: HookHandler = (args, context) => {
  const scene = worldDocument(args[0]);
  if (scene === null) {
    return;
  }
  const userId = userIdOf(args[3]);
  if (isSceneActivation(args[1])) {
    emitIf(context, 'scene-activated', toSceneChange(scene, userId));
  }
  emitIf(context, 'scene-updated', toSceneUpdated(scene, args[1], userId));
};

/** canvasReady(canvas) is a `Hooks.call` hook: a listener returning false would stop the others; this one returns nothing. */
const onCanvasReady: HookHandler = (args, context) => {
  const canvas = args[0];
  const scene = toSceneRef(isRecord(canvas) ? (canvas as FoundryCanvasLike).scene : null);
  if (scene === null || scene.sceneId === context.state.lastViewedSceneId) {
    return;
  }
  context.state.lastViewedSceneId = scene.sceneId;
  context.emit({ name: 'scene-viewed', data: scene });
};

const onChatMessageCreate: HookHandler = (args, context) => {
  const message = worldDocument(args[0]);
  emitIf(context, 'chat-message-created', message !== null ? toChatMessageCreated(message) : null);
};

/** userConnected(user, active): runs for the other users, never for this client's own. */
const onUserConnected: HookHandler = (args, context) => {
  const user = args[0];
  const data = isRecord(user) ? toUserConnection(user as FoundryUserLike) : null;
  emitIf(context, args[1] === true ? 'user-connected' : 'user-disconnected', data);
};

/** pauseGame(paused, options) */
const onPauseGame: HookHandler = (args, context) => {
  const paused = args[0] === true;
  context.emit({ name: paused ? 'game-paused' : 'game-resumed', data: { paused } });
};

/** updateWorldTime(worldTime, dt, options, userId) */
const onWorldTime: HookHandler = (args, context) => {
  const [worldTime, delta] = args;
  if (typeof worldTime !== 'number' || !Number.isFinite(worldTime)) {
    return;
  }
  context.emit({
    name: 'world-time-changed',
    data: {
      worldTime,
      delta: typeof delta === 'number' && Number.isFinite(delta) ? delta : 0,
      userId: userIdOf(args[3])
    }
  });
};

/** targetToken(user, token, targeted): once per token added to or removed from a user's targets. */
const onTargetToken: HookHandler = (args, context) => {
  const [user, token] = args;
  const placeable = isRecord(token) ? (token as FoundryTokenPlaceableLike) : null;
  emitIf(context, 'targets-changed', isRecord(user) ? toTargetsChanged(user as FoundryUserLike, placeable) : null);
};

export const HOOK_BINDINGS: readonly HookBinding[] = [
  binding('updateCombat', ['combat-started', 'combat-round-changed', 'combat-turn-changed'], onCombatUpdate),
  onCreateOrDelete('deleteCombat', 'combat-ended', toCombatEnded),
  onCreateOrDelete('createToken', 'token-created', toTokenCreated),
  binding('updateToken', ['token-moved', 'token-updated'], onTokenUpdate),
  onCreateOrDelete('deleteToken', 'token-deleted', toTokenDeleted),
  onCreateOrDelete('createActor', 'actor-created', toActorChange),
  onUpdate('updateActor', 'actor-updated', toActorUpdated),
  onCreateOrDelete('deleteActor', 'actor-deleted', toActorChange),
  onCreateOrDelete('createItem', 'item-created', toItemChange),
  onUpdate('updateItem', 'item-updated', toItemUpdated),
  onCreateOrDelete('deleteItem', 'item-deleted', toItemChange),
  onCreateOrDelete('createJournalEntry', 'journal-created', toJournalChange),
  onUpdate('updateJournalEntry', 'journal-updated', toJournalUpdated),
  onCreateOrDelete('deleteJournalEntry', 'journal-deleted', toJournalChange),
  onJournalPage('createJournalEntryPage', 'created'),
  onJournalPage('updateJournalEntryPage', 'updated'),
  onJournalPage('deleteJournalEntryPage', 'deleted'),
  onCreateOrDelete('createScene', 'scene-created', toSceneChange),
  binding('updateScene', ['scene-updated', 'scene-activated'], onSceneUpdate),
  onCreateOrDelete('deleteScene', 'scene-deleted', toSceneChange),
  binding('canvasReady', ['scene-viewed'], onCanvasReady),
  binding('createChatMessage', ['chat-message-created'], onChatMessageCreate),
  binding('userConnected', ['user-connected', 'user-disconnected'], onUserConnected),
  binding('pauseGame', ['game-paused', 'game-resumed'], onPauseGame),
  binding('updateWorldTime', ['world-time-changed'], onWorldTime),
  binding('targetToken', ['targets-changed'], onTargetToken)
];
