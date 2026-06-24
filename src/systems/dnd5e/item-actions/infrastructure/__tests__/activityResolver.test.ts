import { resolveActivity } from '../activityResolver';
import type { FoundryItem } from '../foundryItemActionTypes';

const activity = { _id: 'act-1', name: 'Attack', type: 'attack', use: jest.fn() };

function itemWith(activities: unknown): FoundryItem {
  return {
    id: 'i1',
    name: 'Sword',
    type: 'weapon',
    system: { activities },
    displayCard: jest.fn()
  } as unknown as FoundryItem;
}

const noSelector = { activityId: undefined, activityType: undefined };

describe('resolveActivity', () => {
  it('returns the first activity when no selector is given', () => {
    const item = itemWith({ contents: [activity], get: jest.fn(), find: jest.fn() });
    expect(resolveActivity(item, noSelector)).toBe(activity);
  });

  it('returns undefined when the item has no activities', () => {
    expect(resolveActivity(itemWith(undefined), noSelector)).toBeUndefined();
  });

  it('resolves by activityId', () => {
    const get = jest.fn().mockReturnValue(activity);
    const item = itemWith({ contents: [], get, find: jest.fn() });
    expect(resolveActivity(item, { activityId: 'act-1', activityType: undefined })).toBe(activity);
    expect(get).toHaveBeenCalledWith('act-1');
  });

  it('throws when activityId is not found', () => {
    const item = itemWith({ contents: [], get: jest.fn().mockReturnValue(undefined), find: jest.fn() });
    expect(() => resolveActivity(item, { activityId: 'missing', activityType: undefined })).toThrow(
      'Activity not found: missing'
    );
  });

  it('resolves by activityType', () => {
    const find = jest.fn().mockReturnValue(activity);
    const item = itemWith({ contents: [], get: jest.fn(), find });
    expect(resolveActivity(item, { activityId: undefined, activityType: 'attack' })).toBe(activity);
    expect(find).toHaveBeenCalled();
  });

  it('throws when activityType is not found', () => {
    const item = itemWith({ contents: [], get: jest.fn(), find: jest.fn().mockReturnValue(undefined) });
    expect(() => resolveActivity(item, { activityId: undefined, activityType: 'heal' })).toThrow(
      "No activity of type 'heal' found on item: Sword"
    );
  });
});
