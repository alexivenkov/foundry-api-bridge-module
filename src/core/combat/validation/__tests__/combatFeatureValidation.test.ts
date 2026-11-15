import {
  addCombatantRequestSchema,
  combatantGroupAddressRequestSchema,
  combatantGroupsRequestSchema,
  createCombatantGroupRequestSchema,
  encounterAddressRequestSchema,
  getCombatsRequestSchema,
  toAddCombatantCommand,
  toCombatantGroupAddress,
  toCreateCombatantGroupCommand,
  toEncounterAddress,
  toToggleSceneLinkCommand,
  toUpdateCombatantCommand,
  toUpdateCombatantGroupCommand,
  toUpdateTrackerConfigCommand,
  toggleCombatSceneLinkRequestSchema,
  updateCombatTrackerConfigRequestSchema,
  updateCombatantGroupRequestSchema,
  updateCombatantRequestSchema
} from '..';

describe('encounter requests', () => {
  it('need nothing and ignore unknown keys', () => {
    expect(getCombatsRequestSchema.parse({ verbose: true })).toEqual({});
    expect(encounterAddressRequestSchema.parse({ extra: 1 })).toEqual({});
  });

  it.each([[''], [null], [undefined]])('read a combatId of %j as the active combat', (combatId) => {
    expect(toEncounterAddress(encounterAddressRequestSchema.parse({ combatId })).combatId).toBeUndefined();
    expect(toToggleSceneLinkCommand(toggleCombatSceneLinkRequestSchema.parse({ combatId })).combatId).toBeUndefined();
  });

  it('read an empty or null scene as the active one', () => {
    expect(toToggleSceneLinkCommand({ combatId: 'fight', sceneId: '' })).toEqual({ combatId: 'fight', sceneId: undefined });
    expect(toToggleSceneLinkCommand({ sceneId: null }).sceneId).toBeUndefined();
    expect(toToggleSceneLinkCommand({ sceneId: 'crypt' }).sceneId).toBe('crypt');
  });

  it('reject an id that is not a string', () => {
    expect(encounterAddressRequestSchema.safeParse({ combatId: 7 }).success).toBe(false);
    expect(toggleCombatSceneLinkRequestSchema.safeParse({ sceneId: 7 }).success).toBe(false);
  });
});

describe('add-combatant with a token or a group', () => {
  it('needs an actor or a token', () => {
    expect(addCombatantRequestSchema.safeParse({ tokenId: 'wolf' }).success).toBe(true);
    expect(addCombatantRequestSchema.safeParse({ tokenId: '' }).success).toBe(false);
    expect(addCombatantRequestSchema.safeParse({ tokenId: null }).success).toBe(false);
  });

  it('needs a token for a scene', () => {
    expect(addCombatantRequestSchema.safeParse({ actorId: 'a1', sceneId: 'crypt' }).success).toBe(false);
    expect(addCombatantRequestSchema.safeParse({ actorId: 'a1', sceneId: '' }).success).toBe(true);
    expect(addCombatantRequestSchema.safeParse({ actorId: 'a1', tokenId: 't1', sceneId: 'crypt' }).success).toBe(true);
  });

  it('checks the new fields strictly', () => {
    expect(addCombatantRequestSchema.safeParse({ actorId: 'a1', groupId: 5 }).success).toBe(false);
    expect(addCombatantRequestSchema.safeParse({ actorId: 'a1', groupId: '' }).success).toBe(false);
    expect(addCombatantRequestSchema.safeParse({ tokenId: 't1', sceneId: 5 }).success).toBe(false);
  });

  it('looks the token up when no actor is given', () => {
    expect(toAddCombatantCommand({ tokenId: 'wolf', hidden: false, initiative: 3, groupId: 'pack' })).toEqual({
      combatId: undefined,
      token: { tokenId: 'wolf', sceneId: undefined, actorId: undefined, initiative: 3, hidden: false, groupId: 'pack' }
    });
  });

  it('looks the token up when a scene is given, keeping the actor to check it', () => {
    expect(toAddCombatantCommand({ combatId: 'fight', actorId: 'a1', tokenId: 'wolf', sceneId: 'crypt' })).toEqual({
      combatId: 'fight',
      token: { tokenId: 'wolf', sceneId: 'crypt', actorId: 'a1', initiative: undefined, hidden: undefined, groupId: undefined }
    });
  });

  it('keeps the ids as given when an actor comes without a scene', () => {
    const command = toAddCombatantCommand({ actorId: 'a1', tokenId: 'wolf', sceneId: null, groupId: 'pack' });

    expect(command.token).toBeUndefined();
    expect(command.draft).toEqual({
      actorId: 'a1',
      tokenId: 'wolf',
      initiative: undefined,
      hidden: undefined,
      groupId: 'pack'
    });
  });

  it('reads a null group as none', () => {
    expect(toAddCombatantCommand({ actorId: 'a1', groupId: null }).draft?.groupId).toBeUndefined();
  });

  it('refuses a request that names neither, should it get past the schema', () => {
    expect(() => toAddCombatantCommand({})).toThrow('actorId or tokenId is required');
  });
});

describe('update-combatant with a group', () => {
  it('moves the combatant into a group, or out of it with null', () => {
    expect(toUpdateCombatantCommand({ combatantId: 'c1', groupId: 'pack' }).changes.groupId).toBe('pack');
    expect(toUpdateCombatantCommand({ combatantId: 'c1', groupId: null }).changes.groupId).toBeNull();
    expect(toUpdateCombatantCommand({ combatantId: 'c1' }).changes.groupId).toBeUndefined();
  });

  it('rejects a group id that is not a non-empty string', () => {
    expect(updateCombatantRequestSchema.safeParse({ combatantId: 'c1', groupId: 3 }).success).toBe(false);
    expect(updateCombatantRequestSchema.safeParse({ combatantId: 'c1', groupId: '' }).success).toBe(false);
    expect(updateCombatantRequestSchema.safeParse({ combatantId: 'c1', groupId: null }).success).toBe(true);
  });
});

describe('combatant group requests', () => {
  it('create with optional fields and an image path', () => {
    expect(createCombatantGroupRequestSchema.safeParse({}).success).toBe(true);
    expect(
      createCombatantGroupRequestSchema.safeParse({ name: 'Wolves', img: 'icons/wolf.WEBP?v=2', initiative: 12.5 }).success
    ).toBe(true);
  });

  it.each([
    ['a name that is not a string', { name: 5 }],
    ['an image that is not an image file', { img: 'notes.txt' }],
    ['a textual initiative', { initiative: '12' }],
    ['an endless initiative', { initiative: Number.POSITIVE_INFINITY }],
    ['a null field on create', { name: null }]
  ])('reject %s', (_case, request) => {
    expect(createCombatantGroupRequestSchema.safeParse(request).success).toBe(false);
  });

  it('update partially, null clearing a field, and need the group id', () => {
    expect(updateCombatantGroupRequestSchema.safeParse({ groupId: 'g1', name: null, img: null, initiative: null }).success).toBe(true);
    expect(updateCombatantGroupRequestSchema.safeParse({ name: 'x' }).success).toBe(false);
    expect(updateCombatantGroupRequestSchema.safeParse({ groupId: '' }).success).toBe(false);
    expect(combatantGroupAddressRequestSchema.safeParse({}).success).toBe(false);
  });

  it('map to commands', () => {
    expect(toEncounterAddress(combatantGroupsRequestSchema.parse({ combatId: '' }))).toEqual({ combatId: undefined });
    expect(toCreateCombatantGroupCommand({ combatId: 'fight', name: 'Wolves' })).toEqual({
      combatId: 'fight',
      draft: { name: 'Wolves', img: undefined, initiative: undefined }
    });
    expect(toUpdateCombatantGroupCommand({ groupId: 'g1', name: null, initiative: 4 })).toEqual({
      combatId: undefined,
      groupId: 'g1',
      changes: { name: null, img: undefined, initiative: 4 }
    });
    expect(toCombatantGroupAddress({ combatId: null, groupId: 'g1' })).toEqual({ combatId: undefined, groupId: 'g1' });
  });
});

describe('update-combat-tracker-config', () => {
  it('accepts every field, null clearing the resource and the marker source', () => {
    expect(
      updateCombatTrackerConfigRequestSchema.safeParse({
        resource: 'attributes.hp.value',
        skipDefeated: true,
        turnMarker: { enabled: false, animation: 'pulse', src: 'icons/marker.webm', disposition: true }
      }).success
    ).toBe(true);
    expect(updateCombatTrackerConfigRequestSchema.safeParse({ resource: null, turnMarker: { src: null } }).success).toBe(true);
  });

  it.each([
    ['a resource that is not an attribute path', { resource: 'hit points' }],
    ['an empty resource', { resource: '' }],
    ['a textual flag', { skipDefeated: 'yes' }],
    ['a marker source that is no image or video', { turnMarker: { src: 'marker.txt' } }],
    ['an empty animation', { turnMarker: { animation: '' } }],
    ['a turn marker that is not an object', { turnMarker: true }]
  ])('rejects %s', (_case, request) => {
    expect(updateCombatTrackerConfigRequestSchema.safeParse(request).success).toBe(false);
  });

  it('maps to a partial change', () => {
    expect(toUpdateTrackerConfigCommand({ skipDefeated: true })).toEqual({
      changes: { resource: undefined, skipDefeated: true, turnMarker: undefined }
    });
    expect(toUpdateTrackerConfigCommand({ turnMarker: { src: null } }).changes.turnMarker).toEqual({
      enabled: undefined,
      animation: undefined,
      src: null,
      disposition: undefined
    });
  });
});
