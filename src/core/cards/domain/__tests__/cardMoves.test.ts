import { diffCardMoves, involvedStackIds, type StackHoldings } from '..';

function holdings(stackId: string, ...cards: string[]): StackHoldings {
  return { stackId, cards: cards.map((id) => ({ id, name: `Card ${id}` })) };
}

describe('diffCardMoves', () => {
  it('reports nothing when no stack changed', () => {
    const state = [holdings('deck', 'a', 'b'), holdings('hand')];

    expect(diffCardMoves(state, state)).toEqual([]);
  });

  it('matches the cards a deal took from the deck with the hands that got them', () => {
    const before = [holdings('deck', 'a', 'b', 'c', 'd'), holdings('h1'), holdings('h2')];
    const after = [holdings('deck', 'd'), holdings('h1', 'a', 'c'), holdings('h2', 'b')];

    expect(diffCardMoves(before, after, 'deck')).toEqual([
      { cardId: 'a', name: 'Card a', fromStackId: 'deck', toStackId: 'h1' },
      { cardId: 'c', name: 'Card c', fromStackId: 'deck', toStackId: 'h1' },
      { cardId: 'b', name: 'Card b', fromStackId: 'deck', toStackId: 'h2' }
    ]);
  });

  it('reports a card returned to its deck as a move from the hand to the deck', () => {
    const before = [holdings('deck', 'b'), holdings('hand', 'a')];
    const after = [holdings('deck', 'a', 'b'), holdings('hand')];

    expect(diffCardMoves(before, after, 'hand')).toEqual([
      { cardId: 'a', name: 'Card a', fromStackId: 'hand', toStackId: 'deck' }
    ]);
  });

  it('names the source of a copy, which the source keeps holding', () => {
    const before = [holdings('deck', 'a'), holdings('other')];
    const after = [holdings('deck', 'a'), holdings('other', 'a')];

    expect(diffCardMoves(before, after, 'deck')).toEqual([
      { cardId: 'a', name: 'Card a', fromStackId: 'deck', toStackId: 'other' }
    ]);
  });

  it('reports a deck recall from several stacks', () => {
    const before = [holdings('deck'), holdings('h1', 'a'), holdings('pile', 'b')];
    const after = [holdings('deck', 'a', 'b'), holdings('h1'), holdings('pile')];

    expect(diffCardMoves(before, after)).toEqual([
      { cardId: 'a', name: 'Card a', fromStackId: 'h1', toStackId: 'deck' },
      { cardId: 'b', name: 'Card b', fromStackId: 'pile', toStackId: 'deck' }
    ]);
  });

  it('reports a card that no stack held before with no source, unless the operation names one', () => {
    const before = [holdings('deck'), holdings('hand')];
    const after = [holdings('deck', 'lost'), holdings('hand')];

    expect(diffCardMoves(before, after)).toEqual([
      { cardId: 'lost', name: 'Card lost', fromStackId: null, toStackId: 'deck' }
    ]);
    expect(diffCardMoves(before, after, 'deck')[0]?.fromStackId).toBeNull();
  });

  it('reports a card that left a stack for no other stack with no destination', () => {
    const before = [holdings('hand', 'orphan', 'b')];
    const after = [holdings('hand', 'b')];

    expect(diffCardMoves(before, after)).toEqual([
      { cardId: 'orphan', name: 'Card orphan', fromStackId: 'hand', toStackId: null }
    ]);
  });

  it('treats a stack missing from the later reading as empty', () => {
    expect(diffCardMoves([holdings('gone', 'a')], [])).toEqual([
      { cardId: 'a', name: 'Card a', fromStackId: 'gone', toStackId: null }
    ]);
  });
});

describe('involvedStackIds', () => {
  it('lists the named stacks first, then the other stacks of the moves, once each', () => {
    const moves = [
      { cardId: 'a', name: 'A', fromStackId: 'h1', toStackId: 'deck' },
      { cardId: 'b', name: 'B', fromStackId: 'h2', toStackId: null },
      { cardId: 'c', name: 'C', fromStackId: null, toStackId: 'deck' }
    ];

    expect(involvedStackIds(['deck'], moves)).toEqual(['deck', 'h1', 'h2']);
  });
});
