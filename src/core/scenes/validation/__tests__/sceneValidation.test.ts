import {
  cloneSceneRequestSchema,
  createSceneRequestSchema,
  getSceneRequestSchema,
  sceneIdRequestSchema,
  toActivateSceneCommand,
  toCloneSceneCommand,
  toCreateSceneCommand,
  toDeleteSceneCommand,
  toDescribeSceneQuery,
  toUpdateSceneCommand,
  toViewSceneCommand,
  updateSceneRequestSchema
} from '..';

describe('scene request schemas', () => {
  describe('get-scene', () => {
    it('needs nothing', () => {
      expect(getSceneRequestSchema.safeParse({}).success).toBe(true);
    });

    it('lets sceneId be empty or null, as the command always has', () => {
      expect(getSceneRequestSchema.safeParse({ sceneId: '' }).success).toBe(true);
      expect(getSceneRequestSchema.safeParse({ sceneId: null }).success).toBe(true);
    });

    it('rejects a sceneId that is not text', () => {
      expect(getSceneRequestSchema.safeParse({ sceneId: 5 }).success).toBe(false);
    });

    it.each([true, false, 1, 0, 'yes', '', null])('accepts includeScreenshot given as %p', (flag) => {
      expect(getSceneRequestSchema.safeParse({ includeScreenshot: flag }).success).toBe(true);
    });
  });

  describe('commands that only name a scene', () => {
    it('require the scene id', () => {
      expect(sceneIdRequestSchema.safeParse({}).success).toBe(false);
      expect(sceneIdRequestSchema.safeParse({ sceneId: null }).success).toBe(false);
      expect(sceneIdRequestSchema.safeParse({ sceneId: 's1' }).success).toBe(true);
    });

    it('pass an empty id on, to be reported as an unknown scene', () => {
      expect(sceneIdRequestSchema.parse({ sceneId: '' })).toEqual({ sceneId: '' });
    });

    it('ignore unknown keys', () => {
      expect(sceneIdRequestSchema.parse({ sceneId: 's1', force: true })).toEqual({ sceneId: 's1' });
    });
  });

  describe('create-scene', () => {
    it('accepts a scene with only its name', () => {
      expect(createSceneRequestSchema.safeParse({ name: 'Crypt' }).success).toBe(true);
    });

    it.each([
      ['no name', {}],
      ['a width given as text', { name: 'Crypt', width: '4000' }],
      ['a non-boolean navigation flag', { name: 'Crypt', navigation: 'yes' }],
      ['a grid that is not an object', { name: 'Crypt', grid: 'square' }],
      ['a null grid', { name: 'Crypt', grid: null }],
      ['a grid size given as text', { name: 'Crypt', grid: { size: '100' } }]
    ])('rejects a new scene with %s', (_case, request) => {
      expect(createSceneRequestSchema.safeParse(request).success).toBe(false);
    });

    it('ignores a grid type outside its enum instead of rejecting the request', () => {
      const parsed = createSceneRequestSchema.parse({ name: 'Crypt', grid: { type: 'triangle', size: 50 } });

      expect(parsed).toEqual({ name: 'Crypt', grid: { size: 50 } });
      expect(createSceneRequestSchema.parse({ name: 'Crypt', grid: { type: null } }).grid?.type).toBeUndefined();
    });

    it.each(['gridless', 'square', 'hexPointyOdd', 'hexPointyEven', 'hexFlatOdd', 'hexFlatEven'])(
      'keeps the grid type %s',
      (type) => {
        expect(createSceneRequestSchema.parse({ name: 'Crypt', grid: { type } }).grid?.type).toBe(type);
      }
    );

    it('accepts an empty grid', () => {
      expect(createSceneRequestSchema.parse({ name: 'Crypt', grid: {} })).toEqual({ name: 'Crypt', grid: {} });
    });

    it('lets null clear the images, the navigation name and the folder', () => {
      const request = { name: 'Crypt', background: null, foreground: null, navName: null, folder: null };

      expect(createSceneRequestSchema.parse(request)).toEqual(request);
    });

    it('ignores unknown keys, in the scene and in its grid', () => {
      const parsed = createSceneRequestSchema.parse({ name: 'Crypt', tokenVision: false, grid: { size: 50, color: '#000' } });

      expect(parsed).toEqual({ name: 'Crypt', grid: { size: 50 } });
    });
  });

  describe('update-scene', () => {
    it('requires the scene id', () => {
      expect(updateSceneRequestSchema.safeParse({ name: 'X' }).success).toBe(false);
    });

    it('accepts an update that changes nothing', () => {
      expect(updateSceneRequestSchema.safeParse({ sceneId: 's1' }).success).toBe(true);
    });

    it('does not let null stand in for a name', () => {
      expect(updateSceneRequestSchema.safeParse({ sceneId: 's1', name: null }).success).toBe(false);
    });

    it('takes every attribute a creation takes', () => {
      const request = {
        sceneId: 's1',
        name: 'Crypt',
        width: 2000,
        height: 1500,
        grid: { type: 'hexFlatEven', size: 70, distance: 2, units: 'm' },
        background: 'maps/crypt.webp',
        foreground: 'fx/fog.webp',
        padding: 0.1,
        navigation: false,
        navName: 'The Crypt',
        navOrder: 3,
        fogExploration: true,
        darkness: 0.5,
        folder: 'folder-1'
      };

      expect(updateSceneRequestSchema.parse(request)).toEqual(request);
    });
  });

  describe('clone-scene', () => {
    it('requires the source', () => {
      expect(cloneSceneRequestSchema.safeParse({ name: 'Copy' }).success).toBe(false);
      expect(cloneSceneRequestSchema.safeParse({ sourceId: 's1' }).success).toBe(true);
    });

    it('lets the copy go to the root folder, but not without a name', () => {
      expect(cloneSceneRequestSchema.safeParse({ sourceId: 's1', folder: null }).success).toBe(true);
      expect(cloneSceneRequestSchema.safeParse({ sourceId: 's1', name: null }).success).toBe(false);
    });
  });
});

describe('scene request mappers', () => {
  it('treats an empty or null sceneId of get-scene as the active scene', () => {
    expect(toDescribeSceneQuery({ sceneId: '' }).sceneId).toBeUndefined();
    expect(toDescribeSceneQuery({ sceneId: null }).sceneId).toBeUndefined();
    expect(toDescribeSceneQuery({}).sceneId).toBeUndefined();
    expect(toDescribeSceneQuery({ sceneId: 's1' }).sceneId).toBe('s1');
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
  ])('reads includeScreenshot %p by its truthiness', (flag, expected) => {
    expect(toDescribeSceneQuery({ includeScreenshot: flag }).includeScreenshot).toBe(expected);
  });

  it('maps the wire names of a new scene to the domain vocabulary', () => {
    const command = toCreateSceneCommand({
      name: 'Crypt',
      width: 2000,
      height: 1500,
      grid: { type: 'hexFlatEven', size: 70 },
      background: 'maps/crypt.webp',
      foreground: 'fx/fog.webp',
      padding: 0.1,
      navigation: false,
      navName: 'The Crypt',
      navOrder: 3,
      fogExploration: true,
      darkness: 0.5,
      folder: 'folder-1'
    });

    expect(command).toEqual({
      draft: {
        name: 'Crypt',
        width: 2000,
        height: 1500,
        grid: { type: 'hexFlatEven', size: 70 },
        backgroundSrc: 'maps/crypt.webp',
        foregroundSrc: 'fx/fog.webp',
        padding: 0.1,
        navigation: false,
        navName: 'The Crypt',
        navOrder: 3,
        fogExploration: true,
        darkness: 0.5,
        folderId: 'folder-1'
      }
    });
  });

  it('keeps an update partial', () => {
    const command = toUpdateSceneCommand({ sceneId: 's1', navName: null });

    expect(command.sceneId).toBe('s1');
    expect(command.changes.navName).toBeNull();
    expect(command.changes.name).toBeUndefined();
    expect(command.changes.grid).toBeUndefined();
    expect(command.changes.backgroundSrc).toBeUndefined();
    expect(command.changes.folderId).toBeUndefined();
  });

  it('keeps null apart from absent, so that it clears', () => {
    const { changes } = toUpdateSceneCommand({ sceneId: 's1', background: null, foreground: null, folder: null });

    expect(changes.backgroundSrc).toBeNull();
    expect(changes.foregroundSrc).toBeNull();
    expect(changes.folderId).toBeNull();
  });

  it('maps a clone request', () => {
    expect(toCloneSceneCommand({ sourceId: 's1', name: 'Copy', folder: 'f1' })).toEqual({
      sourceId: 's1',
      overrides: { name: 'Copy', folderId: 'f1' }
    });
    expect(toCloneSceneCommand({ sourceId: 's1' })).toEqual({
      sourceId: 's1',
      overrides: { name: undefined, folderId: undefined }
    });
  });

  it('maps the commands that only name a scene', () => {
    expect(toActivateSceneCommand({ sceneId: 's1' })).toEqual({ sceneId: 's1' });
    expect(toViewSceneCommand({ sceneId: 's1' })).toEqual({ sceneId: 's1' });
    expect(toDeleteSceneCommand({ sceneId: 's1' })).toEqual({ sceneId: 's1' });
  });
});
