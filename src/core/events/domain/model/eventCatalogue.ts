import type { GameEventName } from './eventPayloads';

export interface EventTypeDescriptor {
  readonly name: GameEventName;
  readonly description: string;
}

/** A milliseconds window in which a burst of moves of one token becomes one `token-moved`. */
export const TOKEN_MOVE_COALESCING_MS = 400;
/** A milliseconds window in which a burst of target changes of one user becomes one `targets-changed`. */
export const TARGETS_COALESCING_MS = 150;

// A Record keyed by every event name: adding an event without a description,
// or describing one that does not exist, does not compile.
const DESCRIPTIONS: Record<GameEventName, string> = {
  'combat-started': 'A combat encounter began (round 0 → 1); carries the combatant whose turn it is.',
  'combat-round-changed': 'The round of a combat changed, forward or back; carries the new round and current combatant.',
  'combat-turn-changed': 'The turn passed to another combatant within the same round.',
  'combat-ended': 'A combat encounter was ended (the encounter was deleted).',
  'token-created': 'A token was placed on a scene.',
  'token-moved': `A token changed position or elevation; moves of one token within ${String(TOKEN_MOVE_COALESCING_MS)} ms arrive as one event with the final position.`,
  'token-updated': 'A token changed in another way than its position; lists the changed top-level keys.',
  'token-deleted': 'A token was removed from a scene.',
  'actor-created': 'A world actor was created.',
  'actor-updated': "A world actor or an unlinked token's actor changed; lists the changed top-level keys.",
  'actor-deleted': 'A world actor was deleted.',
  'item-created': 'An item was created in the world or added to an actor.',
  'item-updated': 'An item changed; lists the changed top-level keys.',
  'item-deleted': 'An item was deleted from the world or removed from an actor.',
  'journal-created': 'A journal entry was created.',
  'journal-updated': 'A journal entry or one of its pages was changed, added or removed.',
  'journal-deleted': 'A journal entry was deleted.',
  'scene-created': 'A scene was created.',
  'scene-updated': 'A scene changed; lists the changed top-level keys.',
  'scene-deleted': 'A scene was deleted.',
  'scene-activated': 'A scene became the active scene, the one players are pulled to.',
  'scene-viewed': "The GM's canvas now shows a scene.",
  'chat-message-created': 'A chat message was posted: speaker, whisper / blind flags, whether it carries rolls, a text preview.',
  'user-connected': 'A user joined the game session.',
  'user-disconnected': 'A user left the game session.',
  'game-paused': 'The game was paused.',
  'game-resumed': 'The game was resumed.',
  'world-time-changed': 'The world time changed; carries the new time and the delta in seconds.',
  'targets-changed': `A user's targeted tokens changed; carries the whole target set. Changes within ${String(TARGETS_COALESCING_MS)} ms arrive as one event.`
};

export const EVENT_CATALOGUE: readonly EventTypeDescriptor[] = Object.entries(DESCRIPTIONS).map(
  ([name, description]) => ({ name: name as GameEventName, description })
);

export const EVENT_NAMES: readonly GameEventName[] = EVENT_CATALOGUE.map((entry) => entry.name);

export function isGameEventName(value: string): value is GameEventName {
  return Object.prototype.hasOwnProperty.call(DESCRIPTIONS, value);
}
