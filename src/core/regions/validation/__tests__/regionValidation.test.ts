import { ValidationError } from '../../../../kernel';
import { parseRequest } from '../../../shared';
import {
  createRegionBehaviorRequestSchema,
  createRegionRequestSchema,
  testRegionPointRequestSchema,
  toCreateRegionBehaviorCommand,
  toCreateRegionCommand,
  toListRegionsQuery,
  toTestRegionPointQuery,
  toUpdateRegionBehaviorCommand,
  toUpdateRegionCommand,
  updateRegionBehaviorRequestSchema,
  updateRegionRequestSchema,
  getRegionsRequestSchema,
  zodBehaviorConfigReader
} from '..';

function parseFails(schema: Parameters<typeof parseRequest>[0], params: unknown): string {
  try {
    parseRequest(schema, params);
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationError);
    return (error as Error).message;
  }
  throw new Error('expected a ValidationError');
}

describe('region request schemas', () => {
  it('reads null or empty sceneId as the active scene', () => {
    expect(toListRegionsQuery(parseRequest(getRegionsRequestSchema, { sceneId: null }))).toEqual({ sceneId: undefined });
    expect(toListRegionsQuery(parseRequest(getRegionsRequestSchema, { sceneId: '' }))).toEqual({ sceneId: undefined });
    expect(toListRegionsQuery(parseRequest(getRegionsRequestSchema, { sceneId: 's1' }))).toEqual({ sceneId: 's1' });
  });

  it('maps a full create request to a draft', () => {
    const request = parseRequest(createRegionRequestSchema, {
      name: 'Pit',
      color: '#00ff00',
      elevation: { bottom: null, top: 5 },
      visibility: 'always',
      shapes: [{ type: 'circle', x: 1, y: 2, radius: 3 }],
      extra: 'ignored'
    });
    expect(toCreateRegionCommand(request)).toEqual({
      sceneId: undefined,
      draft: {
        name: 'Pit',
        color: '#00ff00',
        shapes: [{ type: 'circle', x: 1, y: 2, radius: 3 }],
        elevation: { bottom: null, top: 5 },
        visibility: 'always',
        locked: undefined,
        levelIds: undefined,
        restriction: undefined,
        attachedTokenId: undefined,
        highlightMode: undefined,
        displayMeasurements: undefined,
        hidden: undefined
      }
    });
  });

  it('rejects a blank name, a bad color and an unknown visibility', () => {
    expect(parseFails(createRegionRequestSchema, { name: '  ' })).toBe('name: may not be blank');
    expect(parseFails(createRegionRequestSchema, { name: 'A', color: 'red' })).toBe('color: must be a #rrggbb color');
    expect(parseFails(createRegionRequestSchema, { name: 'A', visibility: 'secret' })).toMatch(/^visibility: /);
    expect(parseFails(updateRegionRequestSchema, { regionId: '' })).toMatch(/^regionId: /);
  });

  it('validates every shape type', () => {
    const ok = (shape: unknown): void => {
      expect(() => parseRequest(createRegionRequestSchema, { name: 'A', shapes: [shape] })).not.toThrow();
    };
    ok({ type: 'rectangle', x: 0, y: 0, width: 1, height: 1, rotation: 400, anchorX: 0.5, gridBased: true, hole: true });
    ok({ type: 'ellipse', x: 0, y: 0, radiusX: 1, radiusY: 2 });
    ok({ type: 'polygon', points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], origin: null });
    ok({ type: 'cone', x: 0, y: 0, radius: 10, angle: 360 });
    ok({ type: 'ring', x: 0, y: 0, radius: 10, innerWidth: 0, outerWidth: 5 });
    ok({ type: 'line', x: 0, y: 0, length: 10, width: 2 });
    ok({ type: 'emanation', base: { type: 'grid', cells: [{ row: 0, column: 1 }] }, radius: 0 });
    ok({ type: 'token', x: 10, y: 20, width: 1, height: 1, shape: 'trapezoid-2' });

    expect(parseFails(createRegionRequestSchema, { name: 'A', shapes: [{ type: 'circle', x: 0, y: 0, radius: 0 }] })).toMatch(
      /^shapes\.0\.radius: /
    );
    expect(
      parseFails(createRegionRequestSchema, { name: 'A', shapes: [{ type: 'polygon', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }] })
    ).toBe('shapes.0.points: must have at least 3 points');
    expect(
      parseFails(createRegionRequestSchema, { name: 'A', shapes: [{ type: 'cone', x: 0, y: 0, radius: 1, angle: 120, curvature: 'flat' }] })
    ).toBe('shapes.0.angle: may not exceed 90 degrees for a flat cone');
    expect(
      parseFails(createRegionRequestSchema, { name: 'A', shapes: [{ type: 'emanation', base: { type: 'ring', x: 0, y: 0, radius: 1, innerWidth: 0, outerWidth: 0 }, radius: 1 }] })
    ).toMatch(/^shapes\.0\.base/);
    expect(
      parseFails(createRegionRequestSchema, { name: 'A', shapes: [{ type: 'token', x: 1.5, y: 0, width: 1, height: 1, shape: 'ellipse-1' }] })
    ).toMatch(/^shapes\.0\.x: /);
    expect(parseFails(createRegionRequestSchema, { name: 'A', shapes: [{ type: 'blob' }] })).toMatch(/^shapes\.0/);
  });

  it('keeps null on update for clearable fields', () => {
    const request = parseRequest(updateRegionRequestSchema, {
      regionId: 'r1',
      elevation: { top: null },
      attachedTokenId: null,
      restriction: { priority: 2 }
    });
    expect(toUpdateRegionCommand(request).changes).toMatchObject({
      elevation: { top: null },
      attachedTokenId: null,
      restriction: { priority: 2 }
    });
    expect(parseFails(updateRegionRequestSchema, { regionId: 'r1', restriction: { priority: 1.5 } })).toMatch(
      /^restriction\.priority: /
    );
    expect(parseFails(updateRegionRequestSchema, { regionId: 'r1', color: null })).toMatch(/^color: /);
  });

  it('defaults the elevation of a point test to 0', () => {
    expect(toTestRegionPointQuery(parseRequest(testRegionPointRequestSchema, { regionId: 'r1', x: 1, y: 2 }))).toEqual({
      sceneId: undefined,
      regionId: 'r1',
      point: { x: 1, y: 2, elevation: 0 }
    });
    expect(parseFails(testRegionPointRequestSchema, { regionId: 'r1', x: '1', y: 2 })).toMatch(/^x: /);
  });

  it('maps behavior requests with the raw config', () => {
    const create = parseRequest(createRegionBehaviorRequestSchema, {
      regionId: 'r1',
      type: 'pauseGame',
      config: { once: true }
    });
    expect(toCreateRegionBehaviorCommand(create)).toEqual({
      sceneId: undefined,
      regionId: 'r1',
      type: 'pauseGame',
      name: undefined,
      disabled: undefined,
      config: { once: true }
    });
    const update = parseRequest(updateRegionBehaviorRequestSchema, { sceneId: 's1', regionId: 'r1', behaviorId: 'b1', disabled: true });
    expect(toUpdateRegionBehaviorCommand(update)).toMatchObject({ sceneId: 's1', behaviorId: 'b1', disabled: true });
    expect(parseFails(createRegionBehaviorRequestSchema, { regionId: 'r1', type: 'x', config: [1] })).toMatch(/^config: /);
    expect(parseFails(createRegionBehaviorRequestSchema, { regionId: 'r1', type: '' })).toMatch(/^type: /);
  });
});

describe('zodBehaviorConfigReader', () => {
  const read = zodBehaviorConfigReader.read.bind(zodBehaviorConfigReader);
  const fails = (type: string, config: Record<string, unknown>): string => {
    try {
      read(type, config);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      return (error as Error).message;
    }
    throw new Error('expected a ValidationError');
  };

  it('reads the settings of the core types', () => {
    expect(read('adjustDarknessLevel', { mode: 'brighten', modifier: 0.5 })).toEqual({
      kind: 'adjustDarknessLevel',
      settings: { mode: 'brighten', modifier: 0.5 }
    });
    expect(read('teleportToken', { destinationUuids: ['Compendium.world.scenes.Scene.aaaaaaaaaaaaaaaa.Region.bbbbbbbbbbbbbbbb'] })).toEqual({
      kind: 'teleportToken',
      settings: { destinationUuids: ['Compendium.world.scenes.Scene.aaaaaaaaaaaaaaaa.Region.bbbbbbbbbbbbbbbb'] }
    });
    expect(read('suppressWeather', { junk: 1 })).toEqual({ kind: 'suppressWeather', settings: {} });
    expect(read('modifyMovementCost', { difficulties: { walk: 1.25, fly: null } })).toEqual({
      kind: 'modifyMovementCost',
      settings: { difficulties: { walk: 1.25, fly: null } }
    });
  });

  it('rejects what the core would round, clamp or refuse', () => {
    expect(fails('adjustDarknessLevel', { modifier: 1.5 })).toMatch(/^config\.modifier: /);
    expect(fails('displayScrollingText', { events: ['tokenEnter'] })).toMatch(/^config\.events\.0: /);
    expect(fails('toggleBehavior', { events: ['tokenAnimateIn'] })).toMatch(/^config\.events\.0: /);
    expect(fails('executeMacro', { macroUuid: 'Actor.aaaaaaaaaaaaaaaa' })).toBe('config.macroUuid: must be an absolute Macro UUID');
    expect(fails('teleportToken', { destinationUuids: ['..bbbbbbbbbbbbbbbb'] })).toMatch(/must be an absolute Region UUID/);
    expect(fails('teleportToken', { transition: { duration: 1234 } })).toMatch(/^config\.transition\.duration: /);
    expect(fails('teleportToken', { dialog: { revealed: '' } })).toMatch(/use null for the default text/);
    expect(fails('modifyMovementCost', { difficulties: { walk: 1.3 } })).toMatch(/^config\.difficulties\.walk: /);
    expect(fails('modifyMovementCost', { difficulties: { walk: 6 } })).toMatch(/^config\.difficulties\.walk: /);
    expect(
      fails('toggleBehavior', {
        enableUuids: ['Scene.aaaaaaaaaaaaaaaa.Region.bbbbbbbbbbbbbbbb.RegionBehavior.cccccccccccccccc'],
        disableUuids: ['Scene.aaaaaaaaaaaaaaaa.Region.bbbbbbbbbbbbbbbb.RegionBehavior.cccccccccccccccc']
      })
    ).toBe('config.disableUuids: may not repeat a UUID of enableUuids');
    expect(fails('applyActiveEffect', { effectUuids: ['Macro.aaaaaaaaaaaaaaaa'] })).toMatch(/ActiveEffect UUID/);
    expect(fails('defineSurface', { placement: 'side' })).toMatch(/^config\.placement: /);
  });

  it('passes the config of an unknown type through untouched', () => {
    expect(read('mymodule.trap', { damage: '2d6', nested: { a: [1] } })).toEqual({
      kind: 'opaque',
      data: { damage: '2d6', nested: { a: [1] } }
    });
  });
});
