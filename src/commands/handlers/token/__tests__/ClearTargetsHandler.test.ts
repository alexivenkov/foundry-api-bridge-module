import { clearTargetsHandler } from '../ClearTargetsHandler';

interface MockPlaceable {
  id: string;
  setTarget: jest.Mock;
}

interface MockUser {
  id: string;
  targets: Set<MockPlaceable>;
}

let user: MockUser;

beforeEach(() => {
  jest.clearAllMocks();
  user = { id: 'user-1', targets: new Set() };
  (global as Record<string, unknown>)['game'] = { user };
});

function makePlaceable(id: string): MockPlaceable {
  const placeable: MockPlaceable = {
    id,
    setTarget: jest.fn().mockImplementation(function (
      this: void,
      targeted: boolean
    ) {
      if (!targeted) user.targets.delete(placeable);
    })
  };
  return placeable;
}

describe('clearTargetsHandler', () => {
  it('clears all targets and reports the count', async () => {
    const a = makePlaceable('a');
    const b = makePlaceable('b');
    const c = makePlaceable('c');
    user.targets.add(a);
    user.targets.add(b);
    user.targets.add(c);

    const result = await clearTargetsHandler({});

    expect(a.setTarget).toHaveBeenCalledWith(false, { user, releaseOthers: false });
    expect(b.setTarget).toHaveBeenCalledWith(false, { user, releaseOthers: false });
    expect(c.setTarget).toHaveBeenCalledWith(false, { user, releaseOthers: false });
    expect(result).toEqual({ cleared: true, count: 3 });
  });

  it('returns count=0 with cleared=true when no targets exist', async () => {
    const result = await clearTargetsHandler({});
    expect(result).toEqual({ cleared: true, count: 0 });
  });

  it('iterates over a copy of the Set so setTarget can mutate it safely', async () => {
    const a = makePlaceable('a');
    const b = makePlaceable('b');
    user.targets.add(a);
    user.targets.add(b);

    // setTarget removes from the live Set; if we iterated the live Set we could skip elements
    const result = await clearTargetsHandler({});

    expect(a.setTarget).toHaveBeenCalledTimes(1);
    expect(b.setTarget).toHaveBeenCalledTimes(1);
    expect(result.count).toBe(2);
    expect(user.targets.size).toBe(0);
  });

  it('passes releaseOthers=false to avoid cascaded clears', async () => {
    const a = makePlaceable('a');
    user.targets.add(a);

    await clearTargetsHandler({});

    expect(a.setTarget).toHaveBeenCalledWith(false, { user, releaseOthers: false });
  });
});
