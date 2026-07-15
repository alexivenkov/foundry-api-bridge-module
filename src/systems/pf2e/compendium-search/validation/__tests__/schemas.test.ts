import {
  pf2eFilterCompendiumActorsRequestSchema,
  pf2eFilterCompendiumItemsRequestSchema
} from '../schemas';

describe('pf2eFilterCompendiumActorsRequestSchema', () => {
  it('accepts an empty request and the full filter surface', () => {
    expect(pf2eFilterCompendiumActorsRequestSchema.parse({})).toEqual({});
    const parsed = pf2eFilterCompendiumActorsRequestSchema.parse({
      packIds: ['pf2e.monsters'],
      name: ' Zombie ',
      type: ['npc'],
      level: { min: -1, max: 4 },
      traits: ['undead'],
      rarity: ['common', 'uncommon'],
      size: ['med'],
      maxHp: { max: 50 },
      ac: { min: 10 },
      limit: 25,
      offset: 0
    });
    expect(parsed.name).toBe('Zombie');
    expect(parsed.level).toEqual({ min: -1, max: 4 });
  });

  it('rejects unknown enum values and empty filter arrays', () => {
    expect(
      pf2eFilterCompendiumActorsRequestSchema.safeParse({ type: ['monster'] }).success
    ).toBe(false);
    expect(
      pf2eFilterCompendiumActorsRequestSchema.safeParse({ rarity: ['legendary'] }).success
    ).toBe(false);
    expect(
      pf2eFilterCompendiumActorsRequestSchema.safeParse({ traits: [] }).success
    ).toBe(false);
    expect(
      pf2eFilterCompendiumActorsRequestSchema.safeParse({ size: [] }).success
    ).toBe(false);
  });

  it('allows an empty packIds array (explicit "no packs")', () => {
    expect(pf2eFilterCompendiumActorsRequestSchema.parse({ packIds: [] })).toEqual({
      packIds: []
    });
  });
});

describe('pf2eFilterCompendiumItemsRequestSchema', () => {
  it('accepts item filters including categories, traditions, and price', () => {
    const parsed = pf2eFilterCompendiumItemsRequestSchema.parse({
      type: ['feat', 'spell'],
      level: { min: 1, max: 4 },
      category: ['class'],
      traditions: ['arcane'],
      priceGold: { min: 0.1, max: 100 }
    });
    expect(parsed.type).toEqual(['feat', 'spell']);
    expect(parsed.priceGold).toEqual({ min: 0.1, max: 100 });
  });

  it('rejects unknown item types, negative prices, and non-integer levels', () => {
    expect(
      pf2eFilterCompendiumItemsRequestSchema.safeParse({ type: ['gadget'] }).success
    ).toBe(false);
    expect(
      pf2eFilterCompendiumItemsRequestSchema.safeParse({ priceGold: { min: -5 } }).success
    ).toBe(false);
    expect(
      pf2eFilterCompendiumItemsRequestSchema.safeParse({ level: { min: 1.5 } }).success
    ).toBe(false);
  });
});
