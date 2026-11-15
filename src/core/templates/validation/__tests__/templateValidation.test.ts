import { ValidationError } from '../../../../kernel';
import { parseRequest } from '../../../shared';
import {
  createTemplateRequestSchema,
  deleteTemplateRequestSchema,
  getTemplatesRequestSchema,
  updateTemplateRequestSchema
} from '../templateSchemas';
import {
  toCreateTemplateCommand,
  toDeleteTemplateCommand,
  toListTemplatesQuery,
  toUpdateTemplateCommand
} from '../requestMappers';

const cone = { type: 'cone', x: 100, y: 200, distance: 30 };

describe('template request validation', () => {
  it('reads a null or empty sceneId as the active scene', () => {
    expect(toListTemplatesQuery(parseRequest(getTemplatesRequestSchema, { sceneId: '' }))).toEqual({ sceneId: undefined });
    expect(toDeleteTemplateCommand(parseRequest(deleteTemplateRequestSchema, { templateId: 'm', sceneId: null }))).toEqual({
      sceneId: undefined,
      templateId: 'm'
    });
  });

  it('maps a create request', () => {
    expect(
      toCreateTemplateCommand(
        parseRequest(createTemplateRequestSchema, {
          ...cone,
          sceneId: 's1',
          direction: 90,
          angle: 60,
          fillColor: '#FF0000',
          texture: null,
          authorId: 'gmgmgmgmgmgmgmgm',
          extra: true
        })
      )
    ).toEqual({
      sceneId: 's1',
      draft: expect.objectContaining({
        type: 'cone',
        x: 100,
        y: 200,
        distance: 30,
        direction: 90,
        angle: 60,
        fillColor: '#FF0000',
        texture: null,
        authorId: 'gmgmgmgmgmgmgmgm'
      })
    });
  });

  it.each([
    ['no type', { x: 0, y: 0, distance: 5 }],
    ["the core's code instead of the type", { ...cone, type: 'rect' }],
    ['a zero distance', { ...cone, distance: 0 }],
    ['an angle above 360', { ...cone, angle: 400 }],
    ['a negative width', { ...cone, width: -1 }],
    ['a short color', { ...cone, borderColor: '#000' }],
    ['an empty texture path', { ...cone, texture: '' }],
    ['a fractional sort', { ...cone, sort: 0.5 }],
    ['a malformed author', { ...cone, authorId: 'me' }]
  ])('rejects a create request with %s', (_label, params) => {
    expect(() => parseRequest(createTemplateRequestSchema, params)).toThrow(ValidationError);
  });

  it('maps a partial update and requires the template id', () => {
    expect(
      toUpdateTemplateCommand(parseRequest(updateTemplateRequestSchema, { templateId: 'm1', distance: 15, hidden: true }))
    ).toEqual({
      sceneId: undefined,
      templateId: 'm1',
      changes: expect.objectContaining({ distance: 15, hidden: true, type: undefined })
    });
    expect(() => parseRequest(updateTemplateRequestSchema, { distance: 15 })).toThrow(ValidationError);
  });
});
