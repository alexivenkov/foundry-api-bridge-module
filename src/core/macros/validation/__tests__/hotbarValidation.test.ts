import {
  assignHotbarSlotRequestSchema,
  clearHotbarSlotRequestSchema,
  getHotbarRequestSchema,
  moveHotbarSlotRequestSchema,
  toAssignHotbarSlotCommand,
  toClearHotbarSlotCommand,
  toGetHotbarQuery,
  toMoveHotbarSlotCommand
} from '..';

describe('hotbar request schemas', () => {
  it.each([1, 50])('accepts slot %d', (slot) => {
    expect(clearHotbarSlotRequestSchema.safeParse({ slot }).success).toBe(true);
  });

  it.each([0, 51, 1.5, '3', null])('rejects slot %p', (slot) => {
    expect(clearHotbarSlotRequestSchema.safeParse({ slot }).success).toBe(false);
    expect(assignHotbarSlotRequestSchema.safeParse({ macroId: 'm', slot }).success).toBe(false);
  });

  it.each([0, 6, 2.5])('rejects page %p', (page) => {
    expect(getHotbarRequestSchema.safeParse({ page }).success).toBe(false);
  });

  it('needs a macro id to assign, but not a slot', () => {
    expect(assignHotbarSlotRequestSchema.safeParse({ slot: 1 }).success).toBe(false);
    expect(assignHotbarSlotRequestSchema.safeParse({ macroId: '' }).success).toBe(false);
    expect(assignHotbarSlotRequestSchema.parse({ macroId: 'm' })).toEqual({ macroId: 'm' });
  });

  it('refuses a move onto the same slot', () => {
    const parsed = moveHotbarSlotRequestSchema.safeParse({ fromSlot: 4, toSlot: 4 });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(['toSlot']);
  });

  it('ignores unknown keys', () => {
    expect(getHotbarRequestSchema.parse({ page: 1, extra: true })).toEqual({ page: 1 });
  });
});

describe('hotbar request mappers', () => {
  it.each([null, '', undefined])('reads userId %p as the current user', (userId) => {
    expect(toGetHotbarQuery({ userId, page: undefined })).toEqual({ userId: undefined, page: undefined });
  });

  it('maps every command as it came', () => {
    expect(toAssignHotbarSlotCommand({ userId: 'p1', macroId: 'm', slot: 7 })).toEqual({
      userId: 'p1',
      macroId: 'm',
      slot: 7
    });
    expect(toMoveHotbarSlotCommand({ fromSlot: 1, toSlot: 2 })).toEqual({ userId: undefined, fromSlot: 1, toSlot: 2 });
    expect(toClearHotbarSlotCommand({ userId: 'p1', slot: 9 })).toEqual({ userId: 'p1', slot: 9 });
  });
});
