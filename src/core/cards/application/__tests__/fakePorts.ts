import type {
  Card,
  CardChanges,
  CardDraft,
  CardDrawMode,
  CardFolderKind,
  CardMoveOptions,
  CardPreset,
  CardStack,
  CardStackChanges,
  CardStackDraft,
  CardStackStore,
  CardStackSummary,
  CardStore,
  StackHoldings
} from '../../domain';

export function card(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    name: 'Ace of Spades',
    description: '',
    type: 'base',
    suit: 'spades',
    value: 1,
    faces: [{ name: 'Ace of Spades', text: '', img: 'spades-ace.webp' }],
    face: 0,
    faceUp: true,
    back: { name: null, text: '', img: null },
    img: 'spades-ace.webp',
    drawn: false,
    originId: null,
    sort: 0,
    system: {},
    flags: {},
    ...overrides
  };
}

function isHeld(type: string, held: Card): boolean {
  return type !== 'deck' || !held.drawn;
}

/** A stack whose counts follow its cards, as the core counts them. */
export function stack(id: string, type: string, cards: readonly Card[] = [], overrides: Partial<CardStack> = {}): CardStack {
  return {
    id,
    uuid: `Cards.${id}`,
    name: id,
    type,
    img: null,
    folderId: null,
    folderName: null,
    ownerIds: [],
    description: '',
    ...overrides,
    cards,
    cardCount: cards.length,
    availableCount: cards.filter((held) => isHeld(type, held)).length,
    drawnCount: type === 'deck' ? cards.filter((held) => held.drawn).length : null
  };
}

function summaryOf(full: CardStack): CardStackSummary {
  const { cards: _cards, description: _description, ...summary } = full;
  return summary;
}

/**
 * An in-memory world of card stacks. Its operations move cards with the core's
 * rules in small: a deck's card is marked out and copied, any other card is
 * moved; a card going back to its deck is marked in again. `vetoed` makes
 * every operation change nothing, as a hook that prevents it.
 */
export class FakeCardWorld implements CardStackStore, CardStore {
  readonly calls: Array<{ method: string; args: unknown[] }> = [];
  readonly folders = new Map<string, CardFolderKind>([['f-cards', 'card-stacks'], ['f-actors', 'other']]);
  presets: CardPreset[] = [{ key: 'pokerDark', type: 'deck' }];
  cardTypes: string[] = ['base'];
  silenceable = true;
  vetoed = false;
  createsNothing = false;
  messageId: string | null = 'msg1';

  private readonly stacks = new Map<string, CardStack>();

  constructor(stacks: readonly CardStack[] = []) {
    for (const full of stacks) {
      this.stacks.set(full.id, full);
    }
  }

  listStacks(): readonly CardStackSummary[] {
    return [...this.stacks.values()].map(summaryOf);
  }

  findStack(stackId: string): CardStack | null {
    return this.stacks.get(stackId) ?? null;
  }

  readHoldings(): readonly StackHoldings[] {
    return [...this.stacks.values()].map((full) => ({
      stackId: full.id,
      cards: full.cards.filter((held) => isHeld(full.type, held)).map(({ id, name }) => ({ id, name }))
    }));
  }

  findFolderKind(folderId: string): CardFolderKind | null {
    return this.folders.get(folderId) ?? null;
  }

  listPresets(): readonly CardPreset[] {
    return this.presets;
  }

  listCardTypes(): readonly string[] {
    return this.cardTypes;
  }

  canSilenceDeletionRecall(): boolean {
    return this.silenceable;
  }

  createStack(draft: CardStackDraft, preset: string | undefined): Promise<CardStack | null> {
    this.record('createStack', draft, preset);
    if (this.createsNothing) {
      return Promise.resolve(null);
    }
    const created = stack('new', draft.type, [], { name: draft.name, folderId: draft.folderId ?? null });
    this.stacks.set(created.id, created);
    return Promise.resolve(created);
  }

  updateStack(stackId: string, changes: CardStackChanges): Promise<CardStack | null> {
    this.record('updateStack', stackId, changes);
    const current = this.stacks.get(stackId);
    if (current === undefined) {
      return Promise.resolve(null);
    }
    const updated = stack(current.id, current.type, current.cards, {
      ...current,
      ...(changes.name !== undefined ? { name: changes.name } : {}),
      ...(changes.description !== undefined ? { description: changes.description ?? '' } : {})
    });
    this.stacks.set(stackId, updated);
    return Promise.resolve(updated);
  }

  deleteStack(stackId: string, chatNotification: boolean | undefined): Promise<void> {
    this.record('deleteStack', stackId, chatNotification);
    this.recallNow(stackId);
    this.stacks.delete(stackId);
    return Promise.resolve();
  }

  shuffle(stackId: string, options: CardMoveOptions): Promise<void> {
    this.record('shuffle', stackId, options);
    return Promise.resolve();
  }

  deal(
    stackId: string,
    toStackIds: readonly string[],
    count: number,
    mode: CardDrawMode,
    options: CardMoveOptions
  ): Promise<void> {
    this.record('deal', stackId, toStackIds, count, mode, options);
    if (!this.vetoed) {
      for (let round = 0; round < count; round++) {
        for (const toStackId of toStackIds) {
          this.moveTop(stackId, toStackId);
        }
      }
    }
    return Promise.resolve();
  }

  draw(stackId: string, fromStackId: string, count: number, mode: CardDrawMode, options: CardMoveOptions): Promise<void> {
    this.record('draw', stackId, fromStackId, count, mode, options);
    if (!this.vetoed) {
      for (let drawn = 0; drawn < count; drawn++) {
        this.moveTop(fromStackId, stackId);
      }
    }
    return Promise.resolve();
  }

  pass(stackId: string, toStackId: string, cardIds: readonly string[], options: CardMoveOptions): Promise<void> {
    this.record('pass', stackId, toStackId, cardIds, options);
    if (!this.vetoed) {
      for (const cardId of cardIds) {
        this.move(stackId, toStackId, cardId);
      }
    }
    return Promise.resolve();
  }

  recall(stackId: string, options: CardMoveOptions): Promise<void> {
    this.record('recall', stackId, options);
    if (!this.vetoed) {
      this.recallNow(stackId);
    }
    return Promise.resolve();
  }

  createCard(stackId: string, draft: CardDraft): Promise<Card | null> {
    this.record('createCard', stackId, draft);
    return Promise.resolve(this.createsNothing ? null : card({ id: 'new-card', name: draft.name }));
  }

  updateCard(stackId: string, cardId: string, changes: CardChanges): Promise<Card | null> {
    this.record('updateCard', stackId, cardId, changes);
    const current = this.stacks.get(stackId)?.cards.find((held) => held.id === cardId);
    return Promise.resolve(current !== undefined ? { ...current, ...(changes.name !== undefined ? { name: changes.name } : {}) } : null);
  }

  deleteCard(stackId: string, cardId: string): Promise<void> {
    this.record('deleteCard', stackId, cardId);
    return Promise.resolve();
  }

  play(stackId: string, cardId: string, toStackId: string, options: CardMoveOptions): Promise<void> {
    return this.pass(stackId, toStackId, [cardId], options).then(() => {
      this.calls.splice(-1, 1, { method: 'play', args: [stackId, cardId, toStackId, options] });
    });
  }

  discard(stackId: string, cardId: string, toStackId: string, options: CardMoveOptions): Promise<void> {
    return this.pass(stackId, toStackId, [cardId], options).then(() => {
      this.calls.splice(-1, 1, { method: 'discard', args: [stackId, cardId, toStackId, options] });
    });
  }

  flip(stackId: string, cardId: string, face: number | null | undefined): Promise<Card | null> {
    this.record('flip', stackId, cardId, face);
    const current = this.stacks.get(stackId)?.cards.find((held) => held.id === cardId);
    return Promise.resolve(current !== undefined ? { ...current, face: face === undefined ? null : face } : null);
  }

  showInChat(stackId: string, cardId: string, whisperTo: readonly string[]): Promise<string | null> {
    this.record('showInChat', stackId, cardId, whisperTo);
    return Promise.resolve(this.messageId);
  }

  methods(): string[] {
    return this.calls.map((call) => call.method);
  }

  private record(method: string, ...args: unknown[]): void {
    this.calls.push({ method, args });
  }

  private put(full: CardStack, cards: readonly Card[]): void {
    this.stacks.set(full.id, stack(full.id, full.type, cards, full));
  }

  private moveTop(fromStackId: string, toStackId: string): void {
    const from = this.stacks.get(fromStackId);
    const top = from?.cards.find((held) => isHeld(from.type, held));
    if (top !== undefined) {
      this.move(fromStackId, toStackId, top.id);
    }
  }

  private move(fromStackId: string, toStackId: string, cardId: string): void {
    const from = this.stacks.get(fromStackId);
    const to = this.stacks.get(toStackId);
    const moving = from?.cards.find((held) => held.id === cardId);
    if (from === undefined || to === undefined || moving === undefined) {
      return;
    }
    if (from.type === 'deck' && to.type === 'deck') {
      this.put(to, [...to.cards, { ...moving, originId: to.id, drawn: false }]);
      return;
    }
    if (moving.originId === to.id) {
      this.put(to, to.cards.map((held) => (held.id === cardId ? { ...held, drawn: false } : held)));
    } else {
      const origin = from.type === 'deck' ? from.id : moving.originId;
      this.put(to, [...to.cards, { ...moving, originId: origin, drawn: true }]);
    }
    const left = this.stacks.get(fromStackId) ?? from;
    this.put(
      left,
      from.type === 'deck'
        ? left.cards.map((held) => (held.id === cardId ? { ...held, drawn: true } : held))
        : left.cards.filter((held) => held.id !== cardId)
    );
  }

  private recallNow(stackId: string): void {
    const target = this.stacks.get(stackId);
    if (target === undefined) {
      return;
    }
    if (target.type === 'deck') {
      for (const other of this.stacks.values()) {
        if (other.id !== stackId) {
          this.put(other, other.cards.filter((held) => held.originId !== stackId));
        }
      }
      const deck = this.stacks.get(stackId) ?? target;
      this.put(deck, deck.cards.map((held) => ({ ...held, drawn: false })));
      return;
    }
    for (const held of target.cards) {
      const origin = held.originId !== null ? this.stacks.get(held.originId) : undefined;
      if (origin !== undefined) {
        this.put(origin, origin.cards.map((own) => (own.id === held.id ? { ...own, drawn: false } : own)));
      }
    }
    this.put(target, target.cards.filter((held) => held.originId === null));
  }
}
