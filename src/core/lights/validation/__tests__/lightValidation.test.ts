import { ValidationError } from '../../../../kernel';
import { parseRequest } from '../../../shared';
import {
  createLightRequestSchema,
  deleteLightRequestSchema,
  getLightsRequestSchema,
  toCreateLightCommand,
  toDeleteLightCommand,
  toListLightsQuery,
  toUpdateLightCommand,
  updateLightRequestSchema
} from '..';

describe('light request schemas', () => {
  it('reads null or empty sceneId as the active scene', () => {
    expect(toListLightsQuery(parseRequest(getLightsRequestSchema, { sceneId: null }))).toEqual({ sceneId: undefined });
    expect(toListLightsQuery(parseRequest(getLightsRequestSchema, { sceneId: '' }))).toEqual({ sceneId: undefined });
    expect(toListLightsQuery(parseRequest(getLightsRequestSchema, {}))).toEqual({ sceneId: undefined });
    expect(toListLightsQuery(parseRequest(getLightsRequestSchema, { sceneId: 's1' }))).toEqual({ sceneId: 's1' });
  });

  it('requires x and y on create', () => {
    expect(() => parseRequest(createLightRequestSchema, { x: 1 })).toThrow(ValidationError);
    expect(() => parseRequest(createLightRequestSchema, { x: 1 })).toThrow(/^y: /);
  });

  it.each([
    [{ dim: -1 }, /^dim: /],
    [{ angle: 361 }, /^angle: /],
    [{ alpha: 1.5 }, /^alpha: /],
    [{ saturation: -1.1 }, /^saturation: /],
    [{ shadows: 2 }, /^shadows: /],
    [{ coloration: 'neon' }, /^coloration: /],
    [{ coloration: 4 }, /^coloration: /],
    [{ color: 'red' }, /^color: must be a #rrggbb color$/],
    [{ color: '#ff8800aa' }, /^color: /],
    [{ animation: { speed: 11 } }, /^animation\.speed: /],
    [{ animation: { intensity: 0 } }, /^animation\.intensity: /],
    [{ animation: { speed: 2.5 } }, /^animation\.speed: /],
    [{ darkness: { max: 1.5 } }, /^darkness\.max: /],
    [{ priority: -1 }, /^priority: /],
    [{ priority: 1.5 }, /^priority: /],
    [{ levels: [''] }, /^levels\.0: /],
    [{ walls: 'yes' }, /^walls: /]
  ])('rejects %p', (attributes, message) => {
    expect(() => parseRequest(createLightRequestSchema, { x: 0, y: 0, ...attributes })).toThrow(message);
  });

  it('maps a full create request to the domain draft, expanding a short color', () => {
    const command = toCreateLightCommand(
      parseRequest(createLightRequestSchema, {
        sceneId: 's1',
        x: 10,
        y: 20,
        elevation: 5,
        rotation: 45,
        walls: false,
        vision: true,
        hidden: true,
        dim: 30,
        bright: 15,
        angle: 90,
        color: '#F80',
        alpha: 0.6,
        coloration: 'natural-light',
        luminosity: 0.4,
        attenuation: 0.7,
        saturation: -0.3,
        contrast: 0.2,
        shadows: 0.1,
        animation: { type: 'torch', speed: 3, intensity: 8, reverse: true },
        darkness: { min: 0.2, max: 0.8 },
        negative: false,
        priority: 2,
        name: 'Torch',
        locked: true,
        levels: ['lvl'],
        unknownKey: 'ignored'
      })
    );

    expect(command).toEqual({
      sceneId: 's1',
      draft: {
        x: 10,
        y: 20,
        elevation: 5,
        rotation: 45,
        walls: false,
        vision: true,
        hidden: true,
        dim: 30,
        bright: 15,
        angle: 90,
        color: '#ff8800',
        alpha: 0.6,
        coloration: 'natural-light',
        luminosity: 0.4,
        attenuation: 0.7,
        saturation: -0.3,
        contrast: 0.2,
        shadows: 0.1,
        animation: { type: 'torch', speed: 3, intensity: 8, reverse: true },
        darkness: { min: 0.2, max: 0.8 },
        negative: false,
        priority: 2,
        name: 'Torch',
        locked: true,
        levels: ['lvl']
      }
    });
  });

  it('keeps a long color lowercase and lets null clear it', () => {
    expect(toCreateLightCommand(parseRequest(createLightRequestSchema, { x: 0, y: 0, color: '#AbCdEf' })).draft.color).toBe(
      '#abcdef'
    );
    expect(toCreateLightCommand(parseRequest(createLightRequestSchema, { x: 0, y: 0, color: null })).draft.color).toBeNull();
  });

  it('requires a non-empty lightId on update and reads empty animation type or name as null', () => {
    expect(() => parseRequest(updateLightRequestSchema, { lightId: '' })).toThrow(/^lightId: /);
    const command = toUpdateLightCommand(
      parseRequest(updateLightRequestSchema, { lightId: 'l1', animation: { type: '' }, name: '' })
    );
    expect(command).toMatchObject({ sceneId: undefined, lightId: 'l1', changes: { animation: { type: null }, name: null } });
    expect(command.changes.dim).toBeUndefined();
  });

  it('maps a delete request', () => {
    expect(toDeleteLightCommand(parseRequest(deleteLightRequestSchema, { lightId: 'l1', sceneId: '' }))).toEqual({
      sceneId: undefined,
      lightId: 'l1'
    });
    expect(() => parseRequest(deleteLightRequestSchema, {})).toThrow(/^lightId: /);
  });
});
