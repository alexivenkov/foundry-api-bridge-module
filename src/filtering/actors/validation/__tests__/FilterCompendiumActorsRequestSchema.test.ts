import { filterCompendiumActorsRequestSchema } from '../FilterCompendiumActorsRequestSchema';

describe('filterCompendiumActorsRequestSchema', () => {
  it('accepts an empty request', () => {
    expect(filterCompendiumActorsRequestSchema.parse({})).toEqual({});
  });

  it('accepts packIds as a string array', () => {
    expect(
      filterCompendiumActorsRequestSchema.parse({ packIds: ['dnd5e.monsters'] })
    ).toEqual({ packIds: ['dnd5e.monsters'] });
  });

  it('accepts an empty packIds array (explicit "no packs")', () => {
    expect(filterCompendiumActorsRequestSchema.parse({ packIds: [] })).toEqual({
      packIds: []
    });
  });

  it('accepts the full filter surface', () => {
    const parsed = filterCompendiumActorsRequestSchema.parse({
      packIds: ['dnd5e.monsters'],
      name: ' Goblin ',
      type: ['NPC'],
      creatureType: ['humanoid'],
      size: ['sm'],
      disposition: ['hostile'],
      cr: { min: 0.25, max: 5 },
      level: { min: 1 },
      maxHp: { max: 100 },
      ac: { min: 10, max: 18 },
      abilities: { dex: { min: 12 } },
      limit: 25,
      offset: 50
    });
    expect(parsed.name).toBe('Goblin');
    expect(parsed.type).toEqual(['npc']);
  });

  it('rejects world-only filters via type shape (folder/hasPlayerOwner/currentHp stripped)', () => {
    const parsed = filterCompendiumActorsRequestSchema.parse({
      folder: { id: 'f1' },
      hasPlayerOwner: true,
      currentHp: { min: 1 }
    });
    expect(parsed).toEqual({});
  });

  it('rejects invalid cr bounds and out-of-range limits', () => {
    expect(
      filterCompendiumActorsRequestSchema.safeParse({ cr: { min: 0.3 } }).success
    ).toBe(false);
    expect(filterCompendiumActorsRequestSchema.safeParse({ limit: 0 }).success).toBe(
      false
    );
    expect(filterCompendiumActorsRequestSchema.safeParse({ limit: 500 }).success).toBe(
      false
    );
  });

  it('rejects unknown actor types and non-string packIds', () => {
    expect(
      filterCompendiumActorsRequestSchema.safeParse({ type: ['dragonkin'] }).success
    ).toBe(false);
    expect(
      filterCompendiumActorsRequestSchema.safeParse({ packIds: [7] }).success
    ).toBe(false);
  });
});
