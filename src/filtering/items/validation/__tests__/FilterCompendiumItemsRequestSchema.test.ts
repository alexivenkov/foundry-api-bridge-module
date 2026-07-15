import { filterCompendiumItemsRequestSchema } from '../FilterCompendiumItemsRequestSchema';

describe('filterCompendiumItemsRequestSchema', () => {
  it('accepts an empty request', () => {
    expect(filterCompendiumItemsRequestSchema.parse({})).toEqual({});
  });

  it('accepts the full filter surface with packIds', () => {
    const parsed = filterCompendiumItemsRequestSchema.parse({
      packIds: ['dnd5e.spells'],
      name: ' Fire ',
      type: ['spell'],
      rarity: ['common'],
      spellSchool: ['evocation'],
      requiresAttunement: false,
      identified: true,
      hasActivities: true,
      isContainer: false,
      weight: { max: 1 },
      price: { min: 10, max: 500 },
      spellLevel: { min: 1, max: 3 },
      limit: 20,
      offset: 0
    });
    expect(parsed.name).toBe('Fire');
    expect(parsed.packIds).toEqual(['dnd5e.spells']);
  });

  it('strips the world-only folder filter', () => {
    expect(filterCompendiumItemsRequestSchema.parse({ folder: { id: 'f' } })).toEqual({});
  });

  it('rejects invalid spell levels and unknown item types', () => {
    expect(
      filterCompendiumItemsRequestSchema.safeParse({ spellLevel: { min: 10 } }).success
    ).toBe(false);
    expect(
      filterCompendiumItemsRequestSchema.safeParse({ type: ['artifact-weapon'] }).success
    ).toBe(false);
  });
});
