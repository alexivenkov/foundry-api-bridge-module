import { ValidationError } from '../../../../kernel';
import { parseRequest } from '../../../shared';
import {
  createTileRequestSchema,
  deleteTileRequestSchema,
  getTilesRequestSchema,
  updateTileRequestSchema
} from '../tileSchemas';
import {
  toCreateTileCommand,
  toDeleteTileCommand,
  toListTilesQuery,
  toUpdateTileCommand
} from '../requestMappers';

const base = { x: 10, y: 20, width: 100, height: 50 };

describe('tile request validation', () => {
  it('reads a null or empty sceneId as the active scene', () => {
    expect(toListTilesQuery(parseRequest(getTilesRequestSchema, { sceneId: null }))).toEqual({ sceneId: undefined });
    expect(toListTilesQuery(parseRequest(getTilesRequestSchema, { sceneId: '' }))).toEqual({ sceneId: undefined });
    expect(toListTilesQuery(parseRequest(getTilesRequestSchema, {}))).toEqual({ sceneId: undefined });
    expect(toListTilesQuery(parseRequest(getTilesRequestSchema, { sceneId: 's1' }))).toEqual({ sceneId: 's1' });
  });

  it('maps a full create request to a draft', () => {
    const command = toCreateTileCommand(
      parseRequest(createTileRequestSchema, {
        ...base,
        sceneId: 's1',
        elevation: 20,
        sort: 3,
        rotation: 45,
        alpha: 0.5,
        hidden: true,
        locked: false,
        texture: { src: 'tiles/roof.webm', tint: '#AABBCC', scaleX: -1, fit: 'cover', alphaThreshold: 0.2, offsetX: 3 },
        restrictions: { light: true },
        occlusion: { modes: ['fade', 'fade', 'vision'], alpha: 0.3 },
        video: { loop: false, volume: 0.5 },
        levels: ['aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa'],
        unknownKey: 'ignored'
      })
    );

    expect(command).toEqual({
      sceneId: 's1',
      draft: expect.objectContaining({
        ...base,
        elevation: 20,
        sort: 3,
        texture: { src: 'tiles/roof.webm', tint: '#AABBCC', scaleX: -1, fit: 'cover', alphaThreshold: 0.2, offsetX: 3 },
        restrictions: { light: true },
        occlusion: { modes: ['fade', 'vision'], alpha: 0.3 },
        video: { loop: false, volume: 0.5 },
        levels: ['aaaaaaaaaaaaaaaa']
      })
    });
    expect(command.draft).not.toHaveProperty('unknownKey');
  });

  it.each([
    ['missing width', { x: 0, y: 0, height: 10 }],
    ['zero height', { ...base, height: 0 }],
    ['alpha above 1', { ...base, alpha: 1.5 }],
    ['fractional sort', { ...base, sort: 1.5 }],
    ['short tint', { ...base, texture: { tint: '#f00' } }],
    ['unknown fit', { ...base, texture: { fit: 'stretch' } }],
    ['empty image path', { ...base, texture: { src: '' } }],
    ['fractional offset', { ...base, texture: { offsetX: 1.5 } }],
    ['unknown occlusion mode', { ...base, occlusion: { modes: ['roof'] } }],
    ['volume above 1', { ...base, video: { volume: 2 } }],
    ['malformed level id', { ...base, levels: ['level-1'] }],
    ['string coordinate', { ...base, x: '10' }]
  ])('rejects a create request with %s', (_label, params) => {
    expect(() => parseRequest(createTileRequestSchema, params)).toThrow(ValidationError);
  });

  it('maps a partial update and reads an empty name as removing it', () => {
    expect(
      toUpdateTileCommand(
        parseRequest(updateTileRequestSchema, { tileId: 't1', sceneId: '', name: '', texture: { src: null } })
      )
    ).toEqual({
      sceneId: undefined,
      tileId: 't1',
      changes: expect.objectContaining({ name: null, texture: { src: null }, x: undefined, occlusion: undefined })
    });
  });

  it('requires a tile id to update or delete', () => {
    expect(() => parseRequest(updateTileRequestSchema, { x: 1 })).toThrow(ValidationError);
    expect(() => parseRequest(deleteTileRequestSchema, { tileId: '' })).toThrow(ValidationError);
    expect(toDeleteTileCommand(parseRequest(deleteTileRequestSchema, { tileId: 't1', sceneId: null }))).toEqual({
      sceneId: undefined,
      tileId: 't1'
    });
  });
});
