import { ValidationError } from '../../../../kernel';
import { parseRequest } from '../../../shared';
import {
  createDrawingRequestSchema,
  deleteDrawingRequestSchema,
  getDrawingsRequestSchema,
  updateDrawingRequestSchema
} from '../drawingSchemas';
import {
  toCreateDrawingCommand,
  toDeleteDrawingCommand,
  toListDrawingsQuery,
  toUpdateDrawingCommand
} from '../requestMappers';

const rect = { type: 'rectangle', width: 300, height: 60 };

describe('drawing request validation', () => {
  it('reads a null or empty sceneId as the active scene', () => {
    expect(toListDrawingsQuery(parseRequest(getDrawingsRequestSchema, { sceneId: null }))).toEqual({ sceneId: undefined });
    expect(toDeleteDrawingCommand(parseRequest(deleteDrawingRequestSchema, { drawingId: 'd', sceneId: '' }))).toEqual({
      sceneId: undefined,
      drawingId: 'd'
    });
  });

  it('maps a text label request to a draft', () => {
    expect(
      toCreateDrawingCommand(
        parseRequest(createDrawingRequestSchema, {
          sceneId: 's1',
          x: 0,
          y: 0,
          shape: rect,
          stroke: { width: 0 },
          text: { content: 'Tavern', fontSize: 64, fontFamily: null },
          authorId: 'gmgmgmgmgmgmgmgm',
          levels: ['aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa']
        })
      )
    ).toEqual({
      sceneId: 's1',
      draft: expect.objectContaining({
        x: 0,
        y: 0,
        shape: { type: 'rectangle', width: 300, height: 60 },
        stroke: { width: 0 },
        text: { content: 'Tavern', fontSize: 64, fontFamily: null },
        authorId: 'gmgmgmgmgmgmgmgm',
        levels: ['aaaaaaaaaaaaaaaa']
      })
    });
  });

  it('maps a polygon create and keeps only its points', () => {
    const command = toCreateDrawingCommand(
      parseRequest(createDrawingRequestSchema, { x: 0, y: 0, shape: { type: 'polygon', points: [0, 0, 10, 10], width: 5 } })
    );

    expect(command.draft.shape).toEqual({ type: 'polygon', points: [0, 0, 10, 10] });
  });

  it.each([
    ['no shape', { x: 0, y: 0 }],
    ['a circle', { x: 0, y: 0, shape: { type: 'circle', width: 10, height: 10 } }],
    ['a rectangle without height', { x: 0, y: 0, shape: { type: 'rectangle', width: 10 } }],
    ['a polygon with one point', { x: 0, y: 0, shape: { type: 'polygon', points: [0, 0] } }],
    ['a polygon with an odd coordinate count', { x: 0, y: 0, shape: { type: 'polygon', points: [0, 0, 1, 1, 2] } }],
    ['a bezier factor above 0.5', { x: 0, y: 0, shape: rect, bezierFactor: 0.9 }],
    ['an unknown fill type', { x: 0, y: 0, shape: rect, fill: { type: 'gradient' } }],
    ['a fractional stroke width', { x: 0, y: 0, shape: rect, stroke: { width: 2.5 } }],
    ['a font size below 8', { x: 0, y: 0, shape: rect, text: { fontSize: 7 } }],
    ['an empty font family', { x: 0, y: 0, shape: rect, text: { fontFamily: '' } }],
    ['a named color', { x: 0, y: 0, shape: rect, text: { color: 'white' } }],
    ['a malformed author', { x: 0, y: 0, shape: rect, authorId: 'gm' }]
  ])('rejects a create request with %s', (_label, params) => {
    expect(() => parseRequest(createDrawingRequestSchema, params)).toThrow(ValidationError);
  });

  it('maps a partial update; an empty text or name means removing it', () => {
    expect(
      toUpdateDrawingCommand(
        parseRequest(updateDrawingRequestSchema, {
          drawingId: 'd1',
          shape: { points: [0, 0, 5, 5] },
          text: { content: '' },
          name: ''
        })
      )
    ).toEqual({
      sceneId: undefined,
      drawingId: 'd1',
      changes: expect.objectContaining({ shape: { points: [0, 0, 5, 5] }, text: { content: null }, name: null })
    });
  });

  it('requires a drawing id to update', () => {
    expect(() => parseRequest(updateDrawingRequestSchema, { x: 1 })).toThrow(ValidationError);
  });
});
