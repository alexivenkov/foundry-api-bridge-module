import {
  addItemFromCompendiumRequestSchema,
  createActorFromCompendiumRequestSchema,
  createItemFromCompendiumRequestSchema,
  importFromCompendiumRequestSchema
} from '../importSchemas';

describe('compendium import schemas', () => {
  it('importFromCompendium requires packId and documentId', () => {
    expect(importFromCompendiumRequestSchema.safeParse({ packId: 'p' }).success).toBe(
      false
    );
    expect(
      importFromCompendiumRequestSchema.parse({
        packId: 'p',
        documentId: 'd',
        name: 'N',
        folder: 'f'
      })
    ).toEqual({ packId: 'p', documentId: 'd', name: 'N', folder: 'f' });
  });

  it('createActorFromCompendium requires packId and actorId', () => {
    expect(
      createActorFromCompendiumRequestSchema.safeParse({ packId: 'p' }).success
    ).toBe(false);
    expect(
      createActorFromCompendiumRequestSchema.parse({ packId: 'p', actorId: 'a' })
    ).toEqual({ packId: 'p', actorId: 'a' });
  });

  it('createItemFromCompendium requires packId and itemId', () => {
    expect(
      createItemFromCompendiumRequestSchema.parse({ packId: 'p', itemId: 'i' })
    ).toEqual({ packId: 'p', itemId: 'i' });
  });

  it('addItemFromCompendium accepts any numeric quantity (tolerance)', () => {
    const parsed = addItemFromCompendiumRequestSchema.parse({
      actorId: 'a',
      packId: 'p',
      itemId: 'i',
      quantity: -3
    });
    expect(parsed.quantity).toBe(-3);
  });
});
