// Payloads are small plain snapshots: ids, names and what changed — never a
// whole document and never game-system data. Every key is always present;
// an unknown value is null. `userId` is the user whose change caused the event.
// They are type aliases (not interfaces) so they stay assignable to a plain record.

export type CombatantRef = {
  readonly combatantId: string;
  readonly name: string;
  readonly actorId: string | null;
  readonly tokenId: string | null;
};

export type CombatStatePayload = {
  readonly combatId: string;
  readonly sceneId: string | null;
  readonly round: number;
  /** Index into the turn order; null when it is nobody's turn. */
  readonly turn: number | null;
  /** The combatant whose turn it is now. */
  readonly combatant: CombatantRef | null;
  readonly userId: string | null;
};

export type CombatRoundChangedPayload = CombatStatePayload & {
  readonly previousRound: number | null;
};

export type CombatTurnChangedPayload = CombatStatePayload & {
  readonly previousTurn: number | null;
  readonly previousCombatantId: string | null;
};

export type CombatEndedPayload = {
  readonly combatId: string;
  readonly sceneId: string | null;
  readonly round: number;
  readonly userId: string | null;
};

export type TokenRef = {
  readonly tokenId: string;
  readonly sceneId: string | null;
  readonly name: string;
  readonly actorId: string | null;
};

export type TokenCreatedPayload = TokenRef & {
  readonly x: number;
  readonly y: number;
  readonly elevation: number;
  readonly hidden: boolean;
  readonly userId: string | null;
};

export type TokenMovedPayload = TokenRef & {
  readonly x: number;
  readonly y: number;
  readonly elevation: number;
  /** The scene level the token stands on; Foundry 14+ only, omitted before. */
  readonly level?: string;
  readonly userId: string | null;
};

export type TokenUpdatedPayload = TokenRef & {
  /** Changed top-level document keys, sorted; position keys are reported by `token-moved`. */
  readonly changedKeys: readonly string[];
  readonly userId: string | null;
};

export type TokenDeletedPayload = TokenRef & {
  readonly userId: string | null;
};

export type ActorRef = {
  readonly actorId: string;
  readonly name: string;
  /** The actor's document type (`character`, `npc`, …). */
  readonly type: string;
};

export type ActorChangePayload = ActorRef & {
  readonly userId: string | null;
};

export type ActorUpdatedPayload = ActorRef & {
  /** Set when the actor is the synthetic actor of an unlinked token. */
  readonly tokenId: string | null;
  readonly sceneId: string | null;
  readonly changedKeys: readonly string[];
  readonly userId: string | null;
};

export type ItemRef = {
  readonly itemId: string;
  readonly name: string;
  readonly type: string;
  /** The owning actor; null for a world item. */
  readonly actorId: string | null;
  /** Set when the owner is an unlinked token's actor. */
  readonly tokenId: string | null;
};

export type ItemChangePayload = ItemRef & {
  readonly userId: string | null;
};

export type ItemUpdatedPayload = ItemRef & {
  readonly changedKeys: readonly string[];
  readonly userId: string | null;
};

export type JournalRef = {
  readonly journalId: string;
  readonly name: string;
};

export type JournalChangePayload = JournalRef & {
  readonly userId: string | null;
};

export const JOURNAL_PAGE_CHANGES = ['created', 'updated', 'deleted'] as const;
export type JournalPageChangeKind = (typeof JOURNAL_PAGE_CHANGES)[number];

export type JournalPageChange = {
  readonly pageId: string;
  readonly name: string;
  readonly change: JournalPageChangeKind;
  /** Changed top-level keys of the page; empty for a created or deleted page. */
  readonly changedKeys: readonly string[];
};

export type JournalUpdatedPayload = JournalRef & {
  /** `['pages']` when the event comes from a page. */
  readonly changedKeys: readonly string[];
  /** The page that changed; null when the entry itself changed. */
  readonly page: JournalPageChange | null;
  readonly userId: string | null;
};

export type SceneRef = {
  readonly sceneId: string;
  readonly name: string;
};

export type SceneChangePayload = SceneRef & {
  readonly userId: string | null;
};

export type SceneUpdatedPayload = SceneRef & {
  /** `active` is reported by `scene-activated` instead. */
  readonly changedKeys: readonly string[];
  readonly userId: string | null;
};

export type ChatSpeakerRef = {
  readonly alias: string;
  readonly actorId: string | null;
  readonly tokenId: string | null;
  readonly sceneId: string | null;
};

export type ChatMessageCreatedPayload = {
  readonly messageId: string;
  readonly authorId: string | null;
  readonly speaker: ChatSpeakerRef;
  /** User ids the message is whispered to; empty for a public message. */
  readonly whisper: readonly string[];
  /** Hidden from its author (a blind roll). */
  readonly blind: boolean;
  readonly hasRolls: boolean;
  /** Plain text of the content (or of the flavor when the content is empty), capped. */
  readonly preview: string;
};

export type UserConnectionPayload = {
  readonly userId: string;
  readonly name: string;
  readonly isGM: boolean;
};

export type GamePausePayload = {
  readonly paused: boolean;
};

export type WorldTimeChangedPayload = {
  /** World time in seconds. */
  readonly worldTime: number;
  /** Seconds added (negative when time was set back). */
  readonly delta: number;
  readonly userId: string | null;
};

export type TargetsChangedPayload = {
  readonly userId: string;
  readonly userName: string;
  readonly sceneId: string | null;
  /** The user's whole target set after the change. */
  readonly tokenIds: readonly string[];
};

export type GameEventPayloads = {
  'combat-started': CombatStatePayload;
  'combat-round-changed': CombatRoundChangedPayload;
  'combat-turn-changed': CombatTurnChangedPayload;
  'combat-ended': CombatEndedPayload;
  'token-created': TokenCreatedPayload;
  'token-moved': TokenMovedPayload;
  'token-updated': TokenUpdatedPayload;
  'token-deleted': TokenDeletedPayload;
  'actor-created': ActorChangePayload;
  'actor-updated': ActorUpdatedPayload;
  'actor-deleted': ActorChangePayload;
  'item-created': ItemChangePayload;
  'item-updated': ItemUpdatedPayload;
  'item-deleted': ItemChangePayload;
  'journal-created': JournalChangePayload;
  'journal-updated': JournalUpdatedPayload;
  'journal-deleted': JournalChangePayload;
  'scene-created': SceneChangePayload;
  'scene-updated': SceneUpdatedPayload;
  'scene-deleted': SceneChangePayload;
  'scene-activated': SceneChangePayload;
  'scene-viewed': SceneRef;
  'chat-message-created': ChatMessageCreatedPayload;
  'user-connected': UserConnectionPayload;
  'user-disconnected': UserConnectionPayload;
  'game-paused': GamePausePayload;
  'game-resumed': GamePausePayload;
  'world-time-changed': WorldTimeChangedPayload;
  'targets-changed': TargetsChangedPayload;
};

export type GameEventName = keyof GameEventPayloads;
