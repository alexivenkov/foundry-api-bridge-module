import {
  createLevelRequestSchema,
  createSceneRequestSchema,
  createSceneSettingsRequestSchema,
  deleteLevelRequestSchema,
  preloadSceneRequestSchema,
  pullUsersRequestSchema,
  sceneTargetRequestSchema,
  toCreateLevelCommand,
  toCreateSceneCommand,
  toDeleteLevelCommand,
  toPreloadSceneCommand,
  toPullUsersCommand,
  toSceneTargetCommand,
  toUpdateLevelCommand,
  toUpdateSceneCommand,
  toViewSceneCommand,
  updateLevelRequestSchema,
  updateSceneRequestSchema,
  updateSceneSettingsRequestSchema,
  viewSceneRequestSchema
} from '..';

function settingsOf(params: Record<string, unknown>): boolean {
  return createSceneSettingsRequestSchema.safeParse(params).success;
}

describe('scene settings schemas', () => {
  it('accepts every setting with values in range, and lowercases colors', () => {
    const parsed = createSceneSettingsRequestSchema.parse({
      name: 'ignored here',
      weather: 'rain',
      tokenVision: false,
      fogOverlay: 'fx/fog.webp',
      fogExploredColor: '#ABCDEF',
      darknessLock: true,
      blendAmbience: false,
      globalLight: { enabled: true, color: '#FFEEDD', alpha: 1, saturation: -1, darkness: { min: 0, max: 0.5 } },
      baseAmbience: { hue: 0.99, intensity: 0 },
      initialView: { x: -100, y: 0, scale: 0.001 },
      playlistId: 'p1',
      playlistSoundId: null,
      grid: { style: 'roundPoints', color: '#00FF00', alpha: 0, thickness: 1, size: 'tolerated elsewhere' },
      foregroundElevation: 20,
      backgroundColor: '#123456'
    });

    expect(parsed).toMatchObject({
      fogExploredColor: '#abcdef',
      globalLight: { color: '#ffeedd' },
      grid: { style: 'roundPoints', color: '#00ff00', alpha: 0, thickness: 1 }
    });
    expect(parsed).not.toHaveProperty('name');
    expect(parsed.grid).not.toHaveProperty('size');
  });

  it.each([
    ['a short color', { fogExploredColor: '#abc' }],
    ['a named color', { backgroundColor: 'red' }],
    ['an unknown grid style', { grid: { style: 'wavy' } }],
    ['a zero grid thickness', { grid: { thickness: 0 } }],
    ['a fractional grid thickness', { grid: { thickness: 1.5 } }],
    ['a grid alpha above 1', { grid: { alpha: 1.2 } }],
    ['a hue of 1', { darkAmbience: { hue: 1 } }],
    ['a luminosity below -1', { baseAmbience: { luminosity: -1.5 } }],
    ['a global light luminosity below 0', { globalLight: { luminosity: -0.1 } }],
    ['an inverted global light range', { globalLight: { darkness: { min: 0.8, max: 0.2 } } }],
    ['a fractional initial x', { initialView: { x: 1.5 } }],
    ['a tiny initial scale', { initialView: { scale: 0.0004 } }],
    ['an empty weather id', { weather: '' }],
    ['an empty playlist id', { playlistId: '' }],
    ['a zero foreground elevation', { foregroundElevation: 0 }],
    ['a null background color', { backgroundColor: null }],
    ['a string for a flag', { tokenVision: 'no' }]
  ])('rejects %s', (_case, params) => {
    expect(settingsOf(params)).toBe(false);
  });

  it('lets null clear what can be cleared', () => {
    expect(
      settingsOf({
        weather: null,
        fogOverlay: null,
        fogExploredColor: null,
        initialView: null,
        playlistId: null,
        journalId: null,
        journalPageId: null,
        globalLight: { color: null }
      })
    ).toBe(true);
  });

  describe('update-scene', () => {
    it('takes a darkness animation only with a darkness, in whole milliseconds up to ten minutes', () => {
      expect(updateSceneSettingsRequestSchema.safeParse({ darkness: 0.5, animateDarkness: 3000 }).success).toBe(true);
      expect(updateSceneSettingsRequestSchema.safeParse({ animateDarkness: 3000 }).success).toBe(false);
      expect(updateSceneSettingsRequestSchema.safeParse({ darkness: 0.5, animateDarkness: 0 }).success).toBe(false);
      expect(updateSceneSettingsRequestSchema.safeParse({ darkness: 0.5, animateDarkness: 600_001 }).success).toBe(false);
    });

    it('takes an initial level id, or null', () => {
      expect(updateSceneSettingsRequestSchema.safeParse({ initialLevelId: 'l1' }).success).toBe(true);
      expect(updateSceneSettingsRequestSchema.safeParse({ initialLevelId: null }).success).toBe(true);
      expect(updateSceneSettingsRequestSchema.safeParse({ initialLevelId: '' }).success).toBe(false);
    });
  });

  it('leaves the original schemas as tolerant as they were', () => {
    expect(createSceneRequestSchema.parse({ name: 'Crypt', grid: { size: 50, color: '#000' } })).toEqual({
      name: 'Crypt',
      grid: { size: 50 }
    });
  });
});

describe('scene settings request mappers', () => {
  it('merges the two parses of a creation into one draft', () => {
    const params = {
      name: 'Crypt',
      grid: { type: 'square', size: 70, style: 'dottedLines', color: '#FF0000' },
      darkness: 0.2,
      fogOverlay: 'fx/fog.webp',
      playlistId: 'p1'
    };

    const command = toCreateSceneCommand(createSceneRequestSchema.parse(params), createSceneSettingsRequestSchema.parse(params));

    expect(command.draft).toMatchObject({
      name: 'Crypt',
      darkness: 0.2,
      grid: { type: 'square', size: 70, style: 'dottedLines', color: '#ff0000' },
      fogOverlaySrc: 'fx/fog.webp',
      playlistId: 'p1'
    });
  });

  it('keeps the grid of the original parse when no appearance key is given', () => {
    const params = { name: 'Crypt', grid: { size: 70 } };

    const { draft } = toCreateSceneCommand(createSceneRequestSchema.parse(params), createSceneSettingsRequestSchema.parse(params));

    expect(draft.grid).toEqual({ size: 70 });
  });

  it('turns the darkness animation into an update option, and the initial level into a change', () => {
    const params = { sceneId: 's1', darkness: 0.9, animateDarkness: 4000, initialLevelId: 'l2' };

    const command = toUpdateSceneCommand(updateSceneRequestSchema.parse(params), updateSceneSettingsRequestSchema.parse(params));

    expect(command).toMatchObject({
      sceneId: 's1',
      changes: { darkness: 0.9, initialLevelId: 'l2' },
      options: { darknessAnimationMs: 4000 }
    });
  });

  it('sends no options without an animation', () => {
    const params = { sceneId: 's1', weather: 'rain' };

    expect(
      toUpdateSceneCommand(updateSceneRequestSchema.parse(params), updateSceneSettingsRequestSchema.parse(params)).options
    ).toBeUndefined();
  });

  it('maps view-scene with and without a level', () => {
    expect(toViewSceneCommand(viewSceneRequestSchema.parse({ sceneId: 's1', levelId: 'l1' }))).toEqual({
      sceneId: 's1',
      levelId: 'l1'
    });
    expect(viewSceneRequestSchema.safeParse({ sceneId: 's1', levelId: '' }).success).toBe(false);
  });
});

describe('table and level schemas', () => {
  it.each([null, '', undefined])('reads a sceneId of %p as the active scene', (sceneId) => {
    expect(toSceneTargetCommand(sceneTargetRequestSchema.parse({ sceneId })).sceneId).toBeUndefined();
    expect(toPreloadSceneCommand(preloadSceneRequestSchema.parse({ sceneId })).sceneId).toBeUndefined();
  });

  it('maps pull-users-to-scene', () => {
    expect(toPullUsersCommand(pullUsersRequestSchema.parse({ sceneId: 's1', userIds: ['u1'], levelId: 'l1' }))).toEqual({
      sceneId: 's1',
      userIds: ['u1'],
      levelId: 'l1'
    });
    expect(toPullUsersCommand(pullUsersRequestSchema.parse({})).userIds).toBeUndefined();
  });

  it.each([{ userIds: [] }, { userIds: [''] }, { userIds: 'u1' }, { levelId: '' }])(
    'rejects pull-users-to-scene params %p',
    (params) => {
      expect(pullUsersRequestSchema.safeParse(params).success).toBe(false);
    }
  );

  it('maps a level creation to the domain vocabulary', () => {
    const request = createLevelRequestSchema.parse({
      sceneId: '',
      name: ' Cellar ',
      elevation: { bottom: -10, top: null },
      background: { src: 'maps/c.webp', tint: '#FFEEDD' },
      fogOverlay: null,
      positioning: { fit: 'cover', rotation: 359.5, offsetX: -3 },
      visibleLevelIds: ['l1'],
      sort: 2
    });

    expect(toCreateLevelCommand(request)).toEqual({
      sceneId: undefined,
      draft: {
        name: 'Cellar',
        elevation: { bottom: -10, top: null },
        background: { src: 'maps/c.webp', tint: '#ffeedd' },
        foreground: undefined,
        fogOverlaySrc: null,
        positioning: { fit: 'cover', rotation: 359.5, offsetX: -3 },
        visibleLevelIds: ['l1'],
        sort: 2
      }
    });
  });

  it.each([
    ['no name', {}],
    ['a blank name', { name: '  ' }],
    ['an unknown fit', { name: 'X', positioning: { fit: 'stretch' } }],
    ['a rotation of 360', { name: 'X', positioning: { rotation: 360 } }],
    ['a fractional offset', { name: 'X', positioning: { offsetX: 0.5 } }],
    ['an alpha threshold above 1', { name: 'X', background: { alphaThreshold: 2 } }],
    ['a short tint', { name: 'X', foreground: { tint: '#fff' } }],
    ['a fractional sort', { name: 'X', sort: 1.5 }],
    ['an empty visible level id', { name: 'X', visibleLevelIds: [''] }]
  ])('rejects a level with %s', (_case, params) => {
    expect(createLevelRequestSchema.safeParse(params).success).toBe(false);
  });

  it('maps a level update and a deletion', () => {
    expect(toUpdateLevelCommand(updateLevelRequestSchema.parse({ levelId: 'l1', elevation: { top: 5 } }))).toMatchObject({
      sceneId: undefined,
      levelId: 'l1',
      changes: { elevation: { top: 5 } }
    });
    expect(updateLevelRequestSchema.safeParse({ name: 'X' }).success).toBe(false);
    expect(toDeleteLevelCommand(deleteLevelRequestSchema.parse({ sceneId: 's1', levelId: 'l1' }))).toEqual({
      sceneId: 's1',
      levelId: 'l1'
    });
  });
});
