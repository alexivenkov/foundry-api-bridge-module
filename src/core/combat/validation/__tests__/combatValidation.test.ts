import {
  addCombatantRequestSchema,
  combatAddressRequestSchema,
  combatantAddressRequestSchema,
  createCombatRequestSchema,
  rollAllInitiativeRequestSchema,
  rollInitiativeRequestSchema,
  setCombatantDefeatedRequestSchema,
  setInitiativeRequestSchema,
  toAddCombatantCommand,
  toCombatAddress,
  toCombatantAddress,
  toCreateCombatCommand,
  toRollAllInitiativeCommand,
  toRollInitiativeCommand,
  toSetCombatantDefeatedCommand,
  toSetInitiativeCommand,
  toSetTurnCommand,
  toUpdateCombatantCommand,
  updateCombatantRequestSchema
} from '..';

describe('combat request schemas', () => {
  describe('the combat id', () => {
    const schemas = [
      ['a combat address', combatAddressRequestSchema, {}],
      ['a combatant address', combatantAddressRequestSchema, { combatantId: 'c1' }],
      ['add-combatant', addCombatantRequestSchema, { actorId: 'a1' }],
      ['update-combatant', updateCombatantRequestSchema, { combatantId: 'c1' }],
      ['set-combatant-defeated', setCombatantDefeatedRequestSchema, { combatantId: 'c1', defeated: true }],
      ['set-initiative', setInitiativeRequestSchema, { combatantId: 'c1', initiative: 3 }],
      ['roll-initiative', rollInitiativeRequestSchema, { combatantIds: ['c1'] }],
      ['roll-all-initiative', rollAllInitiativeRequestSchema, {}]
    ] as const;

    it.each(schemas)('is optional for %s, and may be empty or null', (_case, schema, rest) => {
      expect(schema.safeParse(rest).success).toBe(true);
      expect(schema.safeParse({ ...rest, combatId: 'fight' }).success).toBe(true);
      expect(schema.safeParse({ ...rest, combatId: '' }).success).toBe(true);
      expect(schema.safeParse({ ...rest, combatId: null }).success).toBe(true);
    });

    it.each(schemas)('must be a string for %s when it is given', (_case, schema, rest) => {
      expect(schema.safeParse({ ...rest, combatId: 7 }).success).toBe(false);
    });
  });

  it('ignores unknown keys', () => {
    expect(combatAddressRequestSchema.parse({ combatId: 'fight', verbose: true })).toEqual({ combatId: 'fight' });
    expect(updateCombatantRequestSchema.parse({ combatantId: 'c1', flags: { x: 1 } })).toEqual({
      combatantId: 'c1'
    });
  });

  it('reads the changes of update-combatant from the `updates` envelope and drops what it cannot use', () => {
    expect(
      updateCombatantRequestSchema.parse({
        combatantId: 'c1',
        updates: { initiative: 20, defeated: 'yes', hidden: true, flags: { x: 1 } }
      })
    ).toEqual({ combatantId: 'c1', updates: { initiative: 20, hidden: true } });
    expect(updateCombatantRequestSchema.parse({ combatantId: 'c1', updates: 'none' })).toEqual({ combatantId: 'c1' });
  });

  it('rejects a request that is not an object', () => {
    expect(combatAddressRequestSchema.safeParse(undefined).success).toBe(false);
    expect(combatAddressRequestSchema.safeParse('fight').success).toBe(false);
  });

  describe('create-combat', () => {
    it('needs nothing', () => {
      expect(createCombatRequestSchema.safeParse({}).success).toBe(true);
    });

    it('accepts a null or empty scene', () => {
      expect(createCombatRequestSchema.parse({ sceneId: null })).toEqual({ sceneId: null });
      expect(createCombatRequestSchema.parse({ sceneId: '' })).toEqual({ sceneId: '' });
    });

    it('rejects a scene that is not a string', () => {
      expect(createCombatRequestSchema.safeParse({ sceneId: 5 }).success).toBe(false);
    });

    it.each([[true], [false], [1], ['yes'], [null]])('accepts an `activate` of %j', (activate) => {
      expect(createCombatRequestSchema.safeParse({ activate }).success).toBe(true);
    });
  });

  describe('combatant commands', () => {
    it('require the combatant id', () => {
      expect(combatantAddressRequestSchema.safeParse({}).success).toBe(false);
      expect(updateCombatantRequestSchema.safeParse({ hidden: true }).success).toBe(false);
      expect(setCombatantDefeatedRequestSchema.safeParse({ defeated: true }).success).toBe(false);
      expect(setInitiativeRequestSchema.safeParse({ initiative: 3 }).success).toBe(false);
    });

    it('require the actor of a new combatant', () => {
      expect(addCombatantRequestSchema.safeParse({}).success).toBe(false);
      expect(addCombatantRequestSchema.safeParse({ actorId: 5 }).success).toBe(false);
    });

    it('accept a null token and a null initiative for a new combatant', () => {
      const request = { actorId: 'a1', tokenId: null, initiative: null };

      expect(addCombatantRequestSchema.parse(request)).toEqual(request);
    });

    it('accept an update that names no attribute', () => {
      expect(updateCombatantRequestSchema.parse({ combatantId: 'c1' })).toEqual({ combatantId: 'c1' });
    });

    it('accept an update that clears the initiative', () => {
      expect(updateCombatantRequestSchema.parse({ combatantId: 'c1', initiative: null }).initiative).toBeNull();
    });

    it.each([
      ['a textual initiative', { combatantId: 'c1', initiative: '12' }],
      ['a textual defeated flag', { combatantId: 'c1', defeated: 'yes' }],
      ['a numeric hidden flag', { combatantId: 'c1', hidden: 1 }]
    ])('reject an update with %s', (_case, request) => {
      expect(updateCombatantRequestSchema.safeParse(request).success).toBe(false);
    });

    it('require a boolean to set the defeated flag', () => {
      expect(setCombatantDefeatedRequestSchema.safeParse({ combatantId: 'c1' }).success).toBe(false);
      expect(setCombatantDefeatedRequestSchema.safeParse({ combatantId: 'c1', defeated: false }).success).toBe(true);
    });
  });

  describe('initiative', () => {
    it('requires an initiative to set, which may be null', () => {
      expect(setInitiativeRequestSchema.safeParse({ combatantId: 'c1' }).success).toBe(false);
      expect(setInitiativeRequestSchema.safeParse({ combatantId: 'c1', initiative: '20' }).success).toBe(false);
      expect(setInitiativeRequestSchema.safeParse({ combatantId: 'c1', initiative: 0 }).success).toBe(true);
      expect(setInitiativeRequestSchema.safeParse({ combatantId: 'c1', initiative: null }).success).toBe(true);
    });

    it('requires a list of combatant ids to roll for, which may be empty', () => {
      expect(rollInitiativeRequestSchema.safeParse({}).success).toBe(false);
      expect(rollInitiativeRequestSchema.safeParse({ combatantIds: 'c1' }).success).toBe(false);
      expect(rollInitiativeRequestSchema.safeParse({ combatantIds: ['c1', 2] }).success).toBe(false);
      expect(rollInitiativeRequestSchema.safeParse({ combatantIds: [] }).success).toBe(true);
    });

    it('accepts a formula, or a null one', () => {
      expect(rollInitiativeRequestSchema.safeParse({ combatantIds: ['c1'], formula: '2d6' }).success).toBe(true);
      expect(rollAllInitiativeRequestSchema.safeParse({ formula: null }).success).toBe(true);
      expect(rollAllInitiativeRequestSchema.safeParse({ formula: 20 }).success).toBe(false);
    });

    it.each([[true], [false], [1], ['yes'], [null]])('accepts an `npcsOnly` of %j', (npcsOnly) => {
      expect(rollAllInitiativeRequestSchema.safeParse({ npcsOnly }).success).toBe(true);
    });
  });
});

describe('combat request mappers', () => {
  describe('the combat id', () => {
    it.each([
      ['a named combat', 'fight', 'fight'],
      ['an empty id', '', undefined],
      ['a null id', null, undefined],
      ['no id', undefined, undefined]
    ])('reads %s', (_case, combatId, expected) => {
      expect(toCombatAddress({ combatId }).combatId).toBe(expected);
      expect(toCombatantAddress({ combatId, combatantId: 'c1' }).combatId).toBe(expected);
      expect(toSetTurnCommand({ combatId, combatantId: 'c1' }).combatId).toBe(expected);
      expect(toAddCombatantCommand({ combatId, actorId: 'a1' }).combatId).toBe(expected);
      expect(toUpdateCombatantCommand({ combatId, combatantId: 'c1' }).combatId).toBe(expected);
      expect(toSetCombatantDefeatedCommand({ combatId, combatantId: 'c1', defeated: true }).combatId).toBe(expected);
      expect(toSetInitiativeCommand({ combatId, combatantId: 'c1', initiative: 1 }).combatId).toBe(expected);
      expect(toRollInitiativeCommand({ combatId, combatantIds: ['c1'] }).combatId).toBe(expected);
      expect(toRollAllInitiativeCommand({ combatId }).combatId).toBe(expected);
    });
  });

  describe('create-combat', () => {
    it.each([
      ['a named scene', 'tavern'],
      ['an empty scene', ''],
      ['a null scene', null],
      ['no scene', undefined]
    ])('passes %s on as it is', (_case, sceneId) => {
      expect(toCreateCombatCommand({ sceneId }).sceneId).toBe(sceneId);
    });

    it.each([
      [true, true],
      [1, true],
      ['false', true],
      [false, false],
      [0, false],
      ['', false],
      [null, false],
      [undefined, false]
    ])('reads an `activate` of %j as %s', (activate, expected) => {
      expect(toCreateCombatCommand({ activate }).activate).toBe(expected);
    });
  });

  it('maps a combatant address and a set-turn request', () => {
    expect(toCombatantAddress({ combatId: 'fight', combatantId: 'c1' })).toEqual({
      combatId: 'fight',
      combatantId: 'c1'
    });
    expect(toSetTurnCommand({ combatantId: 'c2' })).toEqual({ combatId: undefined, combatantId: 'c2' });
  });

  it('maps a new combatant, keeping what is not set unset', () => {
    expect(toAddCombatantCommand({ actorId: 'a1' })).toEqual({
      combatId: undefined,
      draft: { actorId: 'a1', tokenId: undefined, initiative: undefined, hidden: undefined }
    });
    expect(
      toAddCombatantCommand({ combatId: 'fight', actorId: 'a1', tokenId: null, initiative: 0, hidden: false })
    ).toEqual({ combatId: 'fight', draft: { actorId: 'a1', tokenId: null, initiative: 0, hidden: false } });
  });

  it('keeps a combatant update partial', () => {
    const command = toUpdateCombatantCommand({ combatantId: 'c1', initiative: null });

    expect(command.combatantId).toBe('c1');
    expect(command.changes.initiative).toBeNull();
    expect(command.changes.defeated).toBeUndefined();
    expect(command.changes.hidden).toBeUndefined();
  });

  it('maps the defeated flag and an initiative to set', () => {
    expect(toSetCombatantDefeatedCommand({ combatantId: 'c1', defeated: false })).toEqual({
      combatId: undefined,
      combatantId: 'c1',
      defeated: false
    });
    expect(toSetInitiativeCommand({ combatantId: 'c1', initiative: null })).toEqual({
      combatId: undefined,
      combatantId: 'c1',
      initiative: null
    });
  });

  describe('initiative rolls', () => {
    it('maps the combatants and the formula', () => {
      expect(toRollInitiativeCommand({ combatId: 'fight', combatantIds: ['c1', 'c2'], formula: '2d6+5' })).toEqual({
        combatId: 'fight',
        combatantIds: ['c1', 'c2'],
        options: { formula: '2d6+5' }
      });
    });

    it.each([[undefined], [null], ['']])('passes a formula of %j on as it is', (formula) => {
      expect(toRollInitiativeCommand({ combatantIds: ['c1'], formula }).options.formula).toBe(formula);
      expect(toRollAllInitiativeCommand({ formula }).options.formula).toBe(formula);
    });

    it.each([
      [true, true],
      ['yes', true],
      [false, false],
      [null, false],
      [undefined, false]
    ])('reads an `npcsOnly` of %j as %s', (npcsOnly, expected) => {
      expect(toRollAllInitiativeCommand({ npcsOnly }).npcsOnly).toBe(expected);
    });
  });
});
