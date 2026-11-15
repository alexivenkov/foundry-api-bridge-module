import { historyMovementIds, pathDestination, samePosition, totalHistoryCost, type MovementHistoryEntry } from '..';

function entry(overrides: Partial<MovementHistoryEntry>): MovementHistoryEntry {
  return {
    x: 0,
    y: 0,
    elevation: 0,
    action: 'walk',
    movementId: 'm1',
    userId: 'gm',
    cost: 5,
    checkpoint: false,
    explicit: false,
    snapped: true,
    intermediate: false,
    ...overrides
  };
}

describe('core movement model', () => {
  it('finds the destination of a path, carrying unset coordinates over', () => {
    expect(pathDestination({ x: 0, y: 0, elevation: 0 }, [{ x: 100 }, { y: 200 }, { elevation: 10 }])).toEqual({
      x: 100,
      y: 200,
      elevation: 10
    });
    expect(pathDestination({ x: 5, y: 6, elevation: 1 }, [])).toEqual({ x: 5, y: 6, elevation: 1 });
  });

  it('compares positions in whole pixels', () => {
    expect(samePosition({ x: 100.2, y: 50, elevation: 0 }, { x: 100, y: 50, elevation: 0 })).toBe(true);
    expect(samePosition({ x: 100, y: 50, elevation: 5 }, { x: 100, y: 50, elevation: 0 })).toBe(false);
  });

  it('sums recorded costs, unknown as soon as one segment is', () => {
    expect(totalHistoryCost([entry({ cost: 5 }), entry({ cost: 10 })])).toBe(15);
    expect(totalHistoryCost([entry({ cost: 5 }), entry({ cost: null })])).toBeNull();
    expect(totalHistoryCost([])).toBe(0);
  });

  it('lists the recorded movements oldest first, once each', () => {
    expect(historyMovementIds([entry({ movementId: 'a' }), entry({ movementId: 'a' }), entry({ movementId: 'b' })])).toEqual([
      'a',
      'b'
    ]);
  });
});
