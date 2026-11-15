import { parseRequest } from '../../../shared';
import {
  clearTokenMovementHistoryRequestSchema,
  createTokenRequestSchema,
  moveTokenPathRequestSchema,
  pauseTokenMovementRequestSchema,
  resumeTokenMovementRequestSchema,
  toClearMovementHistoryCommand,
  toCreateTokenWithAppearanceCommand,
  toMoveTokenPathCommand,
  toPauseTokenMovementCommand,
  toResumeTokenMovementCommand,
  toUpdatePrototypeTokenCommand,
  toUpdateTokenWithAppearanceCommand,
  updatePrototypeTokenRequestSchema,
  updateTokenRequestSchema
} from '..';

describe('token appearance validation', () => {
  it('maps a full create request, expanding short colors and filling detection mode defaults', () => {
    const command = toCreateTokenWithAppearanceCommand(
      parseRequest(createTokenRequestSchema, {
        actorId: 'a1',
        x: 1,
        y: 2,
        fromPrototype: true,
        includeAppearance: true,
        name: 'Boss',
        disposition: 'friendly',
        displayName: 30,
        displayBars: 'owner',
        texture: { tint: '#F80' },
        light: { color: '#0af', animation: { type: '' } },
        sight: { color: '#123', range: null, applyModeDefaults: false },
        detectionModes: [{ id: 'basicSight' }],
        ring: { ringColor: '#abc', effects: ['pulse'] },
        shape: 'ellipse-2',
        sort: 4
      })
    );

    expect(command).toMatchObject({ fromPrototype: true, includeAppearance: true });
    expect(command.draft).toMatchObject({
      name: 'Boss',
      disposition: 'friendly',
      nameDisplay: 'hover',
      barDisplay: 'owner',
      texture: { tint: '#ff8800' },
      light: { color: '#00aaff', animation: { type: null } },
      sight: { color: '#112233', range: null },
      detectionModes: [{ id: 'basicSight', enabled: true, range: null }],
      ring: { ringColor: '#aabbcc', effects: ['pulse'] },
      shape: 'ellipse-2',
      sort: 4
    });
  });

  it('keeps the legacy numeric codes of update-token and adds the names', () => {
    const byNumber = toUpdateTokenWithAppearanceCommand(parseRequest(updateTokenRequestSchema, { tokenId: 't', disposition: -2, displayName: 50 }));
    const byName = toUpdateTokenWithAppearanceCommand(
      parseRequest(updateTokenRequestSchema, { tokenId: 't', disposition: 'secret', displayName: 'always' })
    );
    expect(byNumber.changes).toMatchObject({ disposition: 'secret', nameDisplay: 'always' });
    expect(byName.changes).toMatchObject({ disposition: 'secret', nameDisplay: 'always' });
    expect(() => toUpdateTokenWithAppearanceCommand(parseRequest(updateTokenRequestSchema, { tokenId: 't', disposition: 7 }))).toThrow(
      'Invalid disposition: 7'
    );
  });

  it.each([
    ['a zero width', { width: 0 }],
    ['an alpha above 1', { alpha: 1.5 }],
    ['a three-digit-less color', { texture: { tint: 'red' } }],
    ['a zero texture scale', { texture: { scaleX: 0 } }],
    ['a fractional texture offset', { texture: { offsetX: 1.5 } }],
    ['a sight angle above 360', { sight: { angle: 400 } }],
    ['a sight brightness above 1', { sight: { brightness: 2 } }],
    ['a light speed above 10', { light: { animation: { speed: 11 } } }],
    ['a ring subject scale below 0.5', { ring: { subjectScale: 0.2 } }],
    ['an unknown ring effect', { ring: { effects: ['glow'] } }],
    ['an unknown shape', { shape: 'hexagon' }],
    ['a fractional sort', { sort: 2.5 }],
    ['an empty bar attribute', { bar1: '' }],
    ['an unknown turn marker mode', { turnMarker: { mode: 'always' } }],
    ['an unknown disposition name', { disposition: 'ally' }]
  ])('rejects %s', (_label, fields) => {
    expect(() => parseRequest(updateTokenRequestSchema, { tokenId: 't', ...fields })).toThrow();
  });

  it('maps a prototype update with the prototype-only fields', () => {
    const command = toUpdatePrototypeTokenCommand(
      parseRequest(updatePrototypeTokenRequestSchema, {
        actorId: 'a1',
        name: 'Gob',
        actorLink: true,
        randomImg: true,
        appendNumber: false,
        prependAdjective: true,
        rotation: 90,
        lockRotation: true,
        disposition: 0,
        displayName: 'owner-hover'
      })
    );
    expect(command).toEqual({
      actorId: 'a1',
      changes: expect.objectContaining({
        name: 'Gob',
        actorLink: true,
        randomImg: true,
        appendNumber: false,
        prependAdjective: true,
        rotation: 90,
        lockRotation: true,
        disposition: 'neutral',
        nameDisplay: 'owner-hover'
      }) as unknown
    });
    expect(() => parseRequest(updatePrototypeTokenRequestSchema, { actorId: '' })).toThrow();
  });
});

describe('core movement validation', () => {
  it('maps a path movement with its defaults off', () => {
    const command = toMoveTokenPathCommand(
      parseRequest(moveTokenPathRequestSchema, { sceneId: '', tokenId: 't', waypoints: [{ x: 100, y: 200, action: 'fly' }], autoRotate: true })
    );
    expect(command).toEqual({
      sceneId: undefined,
      tokenId: 't',
      waypoints: [{ x: 100, y: 200, action: 'fly' }],
      options: { ignoreWalls: false, ignoreCost: false, autoRotate: true, showRuler: false }
    });
  });

  it.each([
    ['no waypoints', { waypoints: [] }],
    ['a fractional x', { waypoints: [{ x: 10.5 }] }],
    ['more than 100 waypoints', { waypoints: Array.from({ length: 101 }, () => ({ x: 1 })) }],
    ['an empty action', { waypoints: [{ action: '' }] }]
  ])('rejects %s', (_label, fields) => {
    expect(() => parseRequest(moveTokenPathRequestSchema, { tokenId: 't', ...fields })).toThrow();
  });

  it('pauses and resumes with the module key by default', () => {
    expect(toPauseTokenMovementCommand(parseRequest(pauseTokenMovementRequestSchema, { tokenId: 't' })).key).toBe('foundry-api-bridge');
    expect(toResumeTokenMovementCommand(parseRequest(resumeTokenMovementRequestSchema, { tokenId: 't', key: 'trap' }))).toMatchObject({
      key: 'trap',
      movementId: undefined
    });
  });

  it('reads empty or null scopes of a history clear as absent', () => {
    expect(
      toClearMovementHistoryCommand(parseRequest(clearTokenMovementHistoryRequestSchema, { sceneId: null, tokenId: '', combatId: 'c1' }))
    ).toEqual({ sceneId: undefined, tokenId: undefined, combatId: 'c1' });
  });
});
