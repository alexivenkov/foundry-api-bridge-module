import { foundryGeneration } from '@/compat/foundryVersion';
import {
  CardPresetLoadFailedError,
  CardStackNotFoundError,
  UnknownCardPresetError,
  type CardDrawMode,
  type CardFolderKind,
  type CardMoveOptions,
  type CardPreset,
  type CardStack,
  type CardStackChanges,
  type CardStackDraft,
  type CardStackStore,
  type CardStackSummary,
  type StackHoldings
} from '@/core/cards/domain';
import { drawModeToCode, toFoundryMoveOptions } from './cardCodes';
import { toCardStack, toCardStackSummary, toFoundryCardsData, toStackHoldings } from './cardStackMapper';
import {
  cardGlobalsFromGlobalThis,
  type CardGlobalsProvider,
  type FoundryCardGlobals,
  type FoundryCardsDocument
} from './foundryCardsTypes';

/** Anti-corruption layer over the world's Cards documents and the `Cards` operations. */
export class FoundryCardStackStore implements CardStackStore {
  constructor(private readonly globals: CardGlobalsProvider = cardGlobalsFromGlobalThis) {}

  listStacks(): readonly CardStackSummary[] {
    return this.globals().game.cards.contents.map(toCardStackSummary);
  }

  findStack(stackId: string): CardStack | null {
    const document = this.globals().game.cards.get(stackId);
    return document !== undefined ? toCardStack(document) : null;
  }

  readHoldings(): readonly StackHoldings[] {
    return this.globals().game.cards.contents.map(toStackHoldings);
  }

  findFolderKind(folderId: string): CardFolderKind | null {
    const folder = this.globals().game.folders.get(folderId);
    if (folder === undefined) {
      return null;
    }
    return folder.type === 'Cards' ? 'card-stacks' : 'other';
  }

  listPresets(): readonly CardPreset[] {
    return Object.entries(this.globals().CONFIG.Cards.presets ?? {}).map(([key, preset]) => ({
      key,
      type: preset.type
    }));
  }

  listCardTypes(): readonly string[] {
    return Object.keys(this.globals().game.model?.Card ?? {});
  }

  // Foundry 13 runs `recall()` before a deletion without the caller's options;
  // Foundry 14 hands them on, so `chatNotification: false` reaches the recall.
  canSilenceDeletionRecall(): boolean {
    return foundryGeneration() >= 14;
  }

  /** As the core's creation dialog does: the preset's data, overridden by the caller's. */
  async createStack(draft: CardStackDraft, preset: string | undefined): Promise<CardStack | null> {
    const globals = this.globals();
    const data = toFoundryCardsData(draft);
    const source =
      preset !== undefined ? globals.foundry.utils.mergeObject(await this.loadPreset(globals, preset), data) : data;
    const document = await globals.CONFIG.Cards.documentClass.create(source);
    return document ? toCardStack(document) : null;
  }

  async updateStack(stackId: string, changes: CardStackChanges): Promise<CardStack | null> {
    const document = this.globals().game.cards.get(stackId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryCardsData(changes));
    return toCardStack(document);
  }

  async deleteStack(stackId: string, chatNotification: boolean | undefined): Promise<void> {
    const document = this.requireDocument(stackId);
    await (chatNotification === undefined ? document.delete() : document.delete({ chatNotification }));
  }

  async shuffle(stackId: string, options: CardMoveOptions): Promise<void> {
    await this.requireDocument(stackId).shuffle(toFoundryMoveOptions(options));
  }

  async deal(
    stackId: string,
    toStackIds: readonly string[],
    count: number,
    mode: CardDrawMode,
    options: CardMoveOptions
  ): Promise<void> {
    const source = this.requireDocument(stackId);
    const destinations = toStackIds.map((id) => this.requireDocument(id));
    await source.deal(destinations, count, { ...toFoundryMoveOptions(options), how: drawModeToCode(mode) });
  }

  async draw(
    stackId: string,
    fromStackId: string,
    count: number,
    mode: CardDrawMode,
    options: CardMoveOptions
  ): Promise<void> {
    const drawer = this.requireDocument(stackId);
    const source = this.requireDocument(fromStackId);
    await drawer.draw(source, count, { ...toFoundryMoveOptions(options), how: drawModeToCode(mode) });
  }

  async pass(stackId: string, toStackId: string, cardIds: readonly string[], options: CardMoveOptions): Promise<void> {
    const source = this.requireDocument(stackId);
    const destination = this.requireDocument(toStackId);
    await source.pass(destination, [...cardIds], toFoundryMoveOptions(options));
  }

  async recall(stackId: string, options: CardMoveOptions): Promise<void> {
    await this.requireDocument(stackId).recall(toFoundryMoveOptions(options));
  }

  private requireDocument(stackId: string): FoundryCardsDocument {
    const document = this.globals().game.cards.get(stackId);
    if (document === undefined) {
      throw new CardStackNotFoundError(stackId);
    }
    return document;
  }

  // `fetch` is called on the globals object: a detached `fetch` is an illegal invocation in a browser.
  private async loadPreset(globals: FoundryCardGlobals, key: string): Promise<Record<string, unknown>> {
    const preset = globals.CONFIG.Cards.presets?.[key];
    if (preset === undefined) {
      throw new UnknownCardPresetError(key, Object.keys(globals.CONFIG.Cards.presets ?? {}));
    }
    let data: unknown;
    try {
      const response = await globals.fetch(preset.src);
      data = response.ok ? await response.json() : null;
    } catch {
      data = null;
    }
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new CardPresetLoadFailedError(key);
    }
    return data as Record<string, unknown>;
  }
}
