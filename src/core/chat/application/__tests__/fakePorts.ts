import type {
  ChatActorDirectory,
  ChatLog,
  ChatMessage,
  ChatMessageChanges,
  ChatMessageDraft,
  ChatRoll,
  DiceRoll,
  DiceRoller,
  PreparedRoll
} from '../../domain';

export function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    timestamp: 1700000000000,
    author: { id: 'gm', name: 'Gamemaster' },
    speaker: { alias: 'Gamemaster', actorId: null, tokenId: null },
    content: '<p>Hello</p>',
    flavor: null,
    style: 'ic',
    isRoll: false,
    whisper: [],
    ...overrides
  };
}

export class FakeChatLog implements ChatLog {
  readonly posted: ChatMessageDraft[] = [];
  readonly updated: Array<{ messageId: string; changes: ChatMessageChanges }> = [];
  readonly deleted: string[] = [];
  readonly cleared: string[][] = [];
  readonly rollsRead: string[] = [];
  vetoesNewMessages = false;
  losesMessageOnUpdate = false;

  constructor(
    private readonly messages: readonly ChatMessage[] = [],
    private readonly rolls: Readonly<Record<string, readonly ChatRoll[]>> = {}
  ) {}

  listMessages(): readonly ChatMessage[] {
    return this.messages;
  }

  listMessageIds(): readonly string[] {
    return this.messages.map((entry) => entry.id);
  }

  hasMessage(messageId: string): boolean {
    return this.messages.some((entry) => entry.id === messageId);
  }

  listRolls(messageId: string): readonly ChatRoll[] {
    this.rollsRead.push(messageId);
    return this.rolls[messageId] ?? [];
  }

  postMessage(draft: ChatMessageDraft): Promise<string | null> {
    this.posted.push(draft);
    return Promise.resolve(this.vetoesNewMessages ? null : 'new-message');
  }

  updateMessage(messageId: string, changes: ChatMessageChanges): Promise<boolean> {
    this.updated.push({ messageId, changes });
    return Promise.resolve(!this.losesMessageOnUpdate);
  }

  deleteMessage(messageId: string): Promise<void> {
    this.deleted.push(messageId);
    return Promise.resolve();
  }

  deleteMessages(messageIds: readonly string[]): Promise<void> {
    this.cleared.push([...messageIds]);
    return Promise.resolve();
  }

  exportEntries(): readonly string[] {
    return this.messages.map((entry) => `[${entry.speaker.alias}] ${entry.id}`);
  }
}

export class FakeActorDirectory implements ChatActorDirectory {
  readonly lookedUp: string[] = [];

  constructor(private readonly names: Readonly<Record<string, string>> = {}) {}

  findActorName(actorId: string): string | null {
    this.lookedUp.push(actorId);
    return this.names[actorId] ?? null;
  }
}

export class FakeDiceRoller implements DiceRoller {
  /** What happened, in order: `prepare:<formula>`, `roll`, `post`. */
  readonly events: string[] = [];
  readonly postedFlavors: Array<string | null | undefined> = [];
  diceCounts: readonly (number | null)[] = [1];
  outcome: DiceRoll = {
    formula: '1d20',
    total: 11,
    dice: [{ faces: 20, count: 1, results: [{ value: 11, kept: true }] }]
  };

  prepare(formula: string): PreparedRoll {
    this.events.push(`prepare:${formula}`);
    return {
      diceCounts: this.diceCounts,
      roll: () => {
        this.events.push('roll');
        return Promise.resolve(this.outcome);
      },
      post: (flavor) => {
        this.events.push('post');
        this.postedFlavors.push(flavor);
        return Promise.resolve();
      }
    };
  }
}
