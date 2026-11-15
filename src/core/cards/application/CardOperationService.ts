import {
  CardMessageFailedError,
  CardNotFoundError,
  CardOperationPreventedError,
  DeckCannotDrawError,
  DeckDestinationError,
  diffCardMoves,
  involvedStackIds,
  isDeck,
  requireAvailable,
  requireCanEnter,
  requireNotOut,
  requireOtherStack,
  resolveFlipTarget,
  type CardDestinationAction,
  type CardOperationName,
  type CardStackStore,
  type CardStore
} from '@/core/cards/domain';
import type {
  DealCardsCommand,
  DrawCardsCommand,
  FlipCardCommand,
  PassCardsCommand,
  PlayCardCommand,
  RecallCardsCommand,
  ShowCardCommand,
  ShuffleCardsCommand
} from './commands';
import type { CardServiceDependencies } from './CardStackService';
import type { CardOperationResult, CardResult, ShownCardResult } from './results';
import { requireCard, requireStack, summarize } from './stackLookup';

/**
 * The card operations of the core: shuffle, deal, draw, pass, play, discard,
 * recall, flip and show. What an operation moved is read from the stacks the
 * core left behind, not assumed from the request.
 */
export class CardOperationService {
  private readonly stacks: CardStackStore;
  private readonly cards: CardStore;

  constructor(deps: CardServiceDependencies) {
    this.stacks = deps.stacks;
    this.cards = deps.cards;
  }

  async shuffle(command: ShuffleCardsCommand): Promise<CardOperationResult> {
    const stack = requireStack(this.stacks, command.stackId);
    await this.stacks.shuffle(stack.id, command.options);
    return { moved: [], stacks: summarize(this.stacks, [stack.id]) };
  }

  async deal(command: DealCardsCommand): Promise<CardOperationResult> {
    const source = requireStack(this.stacks, command.stackId);
    const destinations = command.toStackIds.map((id) => requireStack(this.stacks, id));
    for (const destination of destinations) {
      requireOtherStack(source, destination);
      if (isDeck(destination)) {
        throw new DeckDestinationError('dealt', destination);
      }
    }
    requireAvailable(source, command.count * destinations.length);
    const toStackIds = destinations.map((destination) => destination.id);
    return this.track('deal', source.id, [source.id, ...toStackIds], () =>
      this.stacks.deal(source.id, toStackIds, command.count, command.mode, command.options)
    );
  }

  async draw(command: DrawCardsCommand): Promise<CardOperationResult> {
    const drawer = requireStack(this.stacks, command.stackId);
    const source = requireStack(this.stacks, command.fromStackId);
    requireOtherStack(source, drawer);
    if (isDeck(drawer)) {
      throw new DeckCannotDrawError(drawer);
    }
    requireAvailable(source, command.count);
    return this.track('draw', source.id, [source.id, drawer.id], () =>
      this.stacks.draw(drawer.id, source.id, command.count, command.mode, command.options)
    );
  }

  async pass(command: PassCardsCommand): Promise<CardOperationResult> {
    const source = requireStack(this.stacks, command.stackId);
    const destination = requireStack(this.stacks, command.toStackId);
    requireOtherStack(source, destination);
    for (const cardId of command.cardIds) {
      const card = requireCard(source, cardId);
      requireNotOut(card, source);
      requireCanEnter(card, source, destination);
    }
    return this.track('pass', source.id, [source.id, destination.id], () =>
      this.stacks.pass(source.id, destination.id, command.cardIds, command.options)
    );
  }

  play(command: PlayCardCommand): Promise<CardOperationResult> {
    return this.playTo('play', 'played', command);
  }

  discard(command: PlayCardCommand): Promise<CardOperationResult> {
    return this.playTo('discard', 'discarded', command);
  }

  async recall(command: RecallCardsCommand): Promise<CardOperationResult> {
    const stack = requireStack(this.stacks, command.stackId);
    return this.track(undefined, undefined, [stack.id], () => this.stacks.recall(stack.id, command.options));
  }

  async flip(command: FlipCardCommand): Promise<CardResult> {
    const stack = requireStack(this.stacks, command.stackId);
    const face = resolveFlipTarget(requireCard(stack, command.cardId), command.face);
    const card = await this.cards.flip(stack.id, command.cardId, face);
    if (card === null) {
      throw new CardNotFoundError(stack.id, command.cardId);
    }
    return { stackId: stack.id, card };
  }

  async show(command: ShowCardCommand): Promise<ShownCardResult> {
    const stack = requireStack(this.stacks, command.stackId);
    requireCard(stack, command.cardId);
    const messageId = await this.cards.showInChat(stack.id, command.cardId, command.whisperTo);
    if (messageId === null) {
      throw new CardMessageFailedError();
    }
    return { stackId: stack.id, cardId: command.cardId, messageId };
  }

  private async playTo(
    operation: 'play' | 'discard',
    action: CardDestinationAction,
    command: PlayCardCommand
  ): Promise<CardOperationResult> {
    const source = requireStack(this.stacks, command.stackId);
    const card = requireCard(source, command.cardId);
    const destination = requireStack(this.stacks, command.toStackId);
    requireOtherStack(source, destination);
    if (isDeck(destination)) {
      throw new DeckDestinationError(action, destination);
    }
    requireNotOut(card, source);
    requireCanEnter(card, source, destination);
    const run = (): Promise<void> =>
      operation === 'play'
        ? this.cards.play(source.id, card.id, destination.id, command.options)
        : this.cards.discard(source.id, card.id, destination.id, command.options);
    return this.track(operation, source.id, [source.id, destination.id], run);
  }

  /**
   * Runs an operation between two readings of every stack. An operation that
   * was asked to move cards and moved none was vetoed by a hook.
   */
  private async track(
    operation: CardOperationName | undefined,
    sourceStackId: string | undefined,
    namedStackIds: readonly string[],
    run: () => Promise<void>
  ): Promise<CardOperationResult> {
    const before = this.stacks.readHoldings();
    await run();
    const moved = diffCardMoves(before, this.stacks.readHoldings(), sourceStackId);
    if (operation !== undefined && moved.length === 0) {
      throw new CardOperationPreventedError(operation);
    }
    return { moved, stacks: summarize(this.stacks, involvedStackIds(namedStackIds, moved)) };
  }
}
