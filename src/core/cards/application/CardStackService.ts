import { ValidationError, refuseNewScriptCarriers } from '@/kernel';
import { CoreFeatureUnavailableError } from '@/core/shared';
import {
  CardCreationFailedError,
  CardNotFoundError,
  CardPresetTypeMismatchError,
  CardStackCreationFailedError,
  CardStackFolderNotFoundError,
  CardStackNotFoundError,
  NotACardStackFolderError,
  UnknownCardPresetError,
  UnknownCardTypeError,
  diffCardMoves,
  requireConsistentFace,
  withNewCardDefaults,
  type CardStack,
  type CardStackStore,
  type CardStackSummary,
  type CardStore,
  type ScriptCarrierPolicy
} from '@/core/cards/domain';
import type {
  CreateCardCommand,
  CreateCardStackCommand,
  DeleteCardCommand,
  DeleteCardStackCommand,
  GetCardStackQuery,
  ListCardStacksQuery,
  UpdateCardCommand,
  UpdateCardStackCommand
} from './commands';
import type { CardDeletionResult, CardResult, CardStackDeletionResult } from './results';
import { requireCard, requireStack } from './stackLookup';

export interface CardServiceDependencies {
  readonly stacks: CardStackStore;
  readonly cards: CardStore;
  /** Absent: card data that automation modules run is refused. */
  readonly scripts?: ScriptCarrierPolicy | undefined;
}

const NO_SCRIPTS: ScriptCarrierPolicy = { allowsScripts: () => false };

/** The card stacks of the world and the cards in them. */
export class CardStackService {
  constructor(private readonly deps: CardServiceDependencies) {}

  listStacks(query: ListCardStacksQuery): readonly CardStackSummary[] {
    const stacks = this.deps.stacks.listStacks();
    return query.type === undefined ? stacks : stacks.filter((stack) => stack.type === query.type);
  }

  getStack(query: GetCardStackQuery): CardStack {
    return requireStack(this.deps.stacks, query.stackId);
  }

  async createStack(command: CreateCardStackCommand): Promise<CardStack> {
    const type = this.resolveStackType(command);
    this.requireStackFolder(command.changes.folderId);
    const stack = await this.deps.stacks.createStack({ ...command.changes, name: command.name, type }, command.preset);
    if (stack === null) {
      throw new CardStackCreationFailedError();
    }
    return stack;
  }

  async updateStack(command: UpdateCardStackCommand): Promise<CardStack> {
    requireStack(this.deps.stacks, command.stackId);
    this.requireStackFolder(command.changes.folderId);
    const stack = await this.deps.stacks.updateStack(command.stackId, command.changes);
    if (stack === null) {
      throw new CardStackNotFoundError(command.stackId);
    }
    return stack;
  }

  /**
   * The core recalls a stack's cards before it deletes the stack. The result
   * reports what that moved, apart from the cards that simply went with it.
   */
  async deleteStack(command: DeleteCardStackCommand): Promise<CardStackDeletionResult> {
    const stack = requireStack(this.deps.stacks, command.stackId);
    if (command.chatNotification === false && !this.deps.stacks.canSilenceDeletionRecall()) {
      throw new CoreFeatureUnavailableError(
        'Deleting a card stack without a chat notification requires Foundry 14 or newer'
      );
    }
    const before = this.deps.stacks.readHoldings();
    await this.deps.stacks.deleteStack(stack.id, command.chatNotification);
    const moved = diffCardMoves(before, this.deps.stacks.readHoldings()).filter(
      (move) => !(move.fromStackId === stack.id && move.toStackId === null)
    );
    return { stackId: stack.id, moved };
  }

  async createCard(command: CreateCardCommand): Promise<CardResult> {
    const stack = requireStack(this.deps.stacks, command.stackId);
    if (command.draft.type !== undefined) {
      this.requireCardType(command.draft.type);
    }
    refuseNewScriptCarriers('Card', command.draft, () => this.allowsScripts());
    const card = await this.deps.cards.createCard(stack.id, withNewCardDefaults(command.draft));
    if (card === null) {
      throw new CardCreationFailedError();
    }
    return { stackId: stack.id, card };
  }

  async updateCard(command: UpdateCardCommand): Promise<CardResult> {
    const stack = requireStack(this.deps.stacks, command.stackId);
    const stored = requireCard(stack, command.cardId);
    requireConsistentFace(stored, command.changes);
    refuseNewScriptCarriers('Card', command.changes, () => this.allowsScripts(), () => stored);
    const card = await this.deps.cards.updateCard(stack.id, command.cardId, command.changes);
    if (card === null) {
      throw new CardNotFoundError(stack.id, command.cardId);
    }
    return { stackId: stack.id, card };
  }

  async deleteCard(command: DeleteCardCommand): Promise<CardDeletionResult> {
    const stack = requireStack(this.deps.stacks, command.stackId);
    requireCard(stack, command.cardId);
    await this.deps.cards.deleteCard(stack.id, command.cardId);
    return { stackId: stack.id, cardId: command.cardId };
  }

  private allowsScripts(): boolean {
    return (this.deps.scripts ?? NO_SCRIPTS).allowsScripts();
  }

  private resolveStackType(command: CreateCardStackCommand): string {
    if (command.preset === undefined) {
      if (command.type === undefined) {
        throw new ValidationError('type is required unless preset is given');
      }
      return command.type;
    }
    const presets = this.deps.stacks.listPresets();
    const preset = presets.find((candidate) => candidate.key === command.preset);
    if (preset === undefined) {
      throw new UnknownCardPresetError(
        command.preset,
        presets.map((candidate) => candidate.key)
      );
    }
    if (command.type !== undefined && command.type !== preset.type) {
      throw new CardPresetTypeMismatchError(preset.key, preset.type, command.type);
    }
    return preset.type;
  }

  private requireStackFolder(folderId: string | null | undefined): void {
    if (folderId === undefined || folderId === null) {
      return;
    }
    const kind = this.deps.stacks.findFolderKind(folderId);
    if (kind === null) {
      throw new CardStackFolderNotFoundError(folderId);
    }
    if (kind !== 'card-stacks') {
      throw new NotACardStackFolderError(folderId);
    }
  }

  private requireCardType(type: string): void {
    const types = this.deps.stacks.listCardTypes();
    if (types.length > 0 && !types.includes(type)) {
      throw new UnknownCardTypeError(type, types);
    }
  }
}
