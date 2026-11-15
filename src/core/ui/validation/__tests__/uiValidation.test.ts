import {
  notifyRequestSchema,
  panCanvasRequestSchema,
  pingLocationRequestSchema,
  toNotifyCommand,
  toPanCanvasCommand,
  toPingLocationCommand
} from '..';

describe('ui request schemas', () => {
  describe('notify', () => {
    it('needs only a message', () => {
      expect(notifyRequestSchema.parse({ message: 'hello' })).toEqual({ message: 'hello' });
    });

    it.each(['info', 'warn', 'error', 'success'])('keeps the type %s', (type) => {
      expect(notifyRequestSchema.parse({ message: 'm', type })).toEqual({ message: 'm', type });
    });

    it.each(['fatal', 'warning', '', null, 5])('ignores the unknown type %p instead of rejecting the request', (type) => {
      const parsed = notifyRequestSchema.parse({ message: 'm', type });

      expect(parsed.message).toBe('m');
      expect(parsed.type).toBeUndefined();
    });

    it('accepts an empty message: the UI shows an empty toast', () => {
      expect(notifyRequestSchema.safeParse({ message: '' }).success).toBe(true);
    });

    it.each([
      ['no message', {}],
      ['a non-string message', { message: 5 }],
      ['a non-boolean permanent', { message: 'm', permanent: 'yes' }]
    ])('rejects %s', (_case, request) => {
      expect(notifyRequestSchema.safeParse(request).success).toBe(false);
    });
  });

  describe('pan-canvas', () => {
    it('accepts an empty request', () => {
      expect(panCanvasRequestSchema.parse({})).toEqual({});
    });

    it('accepts any subset of the view, zero included', () => {
      expect(panCanvasRequestSchema.parse({ x: 0, scale: 0.5 })).toEqual({ x: 0, scale: 0.5 });
      expect(panCanvasRequestSchema.parse({ x: 1, y: 2, scale: 3, duration: 0 })).toEqual({
        x: 1,
        y: 2,
        scale: 3,
        duration: 0
      });
    });

    it.each([
      ['a numeric string', { x: '100' }],
      ['a null scale', { scale: null }]
    ])('rejects %s', (_case, request) => {
      expect(panCanvasRequestSchema.safeParse(request).success).toBe(false);
    });
  });

  describe('ping-location', () => {
    it('needs the point', () => {
      expect(pingLocationRequestSchema.parse({ x: 1, y: 2 })).toEqual({ x: 1, y: 2 });
      expect(pingLocationRequestSchema.safeParse({ x: 1 }).success).toBe(false);
      expect(pingLocationRequestSchema.safeParse({}).success).toBe(false);
    });

    it.each(['pulse', 'arrow', 'alert', 'chevron', 'my-module.sparkle', 'bogus'])(
      'takes the style %s as any string: the canvas decides how to draw it',
      (style) => {
        expect(pingLocationRequestSchema.parse({ x: 0, y: 0, style })).toEqual({ x: 0, y: 0, style });
      }
    );

    it.each([
      ['a non-string style', { x: 0, y: 0, style: 3 }],
      ['a non-string color', { x: 0, y: 0, color: 0xff0000 }],
      ['a non-numeric duration', { x: 0, y: 0, duration: 'long' }]
    ])('rejects %s', (_case, request) => {
      expect(pingLocationRequestSchema.safeParse(request).success).toBe(false);
    });
  });

  it('ignores unknown keys everywhere', () => {
    expect(notifyRequestSchema.parse({ message: 'm', localize: true })).toEqual({ message: 'm' });
    expect(panCanvasRequestSchema.parse({ x: 1, speed: 9 })).toEqual({ x: 1 });
    expect(pingLocationRequestSchema.parse({ x: 1, y: 2, pull: true })).toEqual({ x: 1, y: 2 });
  });
});

describe('ui request mappers', () => {
  it('shows a notification without a type as info', () => {
    expect(toNotifyCommand({ message: 'hello' })).toEqual({
      notification: { message: 'hello', level: 'info', permanent: undefined }
    });
  });

  it('shows a notification whose type was unknown, and so dropped by the schema, as info', () => {
    const request = notifyRequestSchema.parse({ message: 'hello', type: 'fatal' });

    expect(toNotifyCommand(request).notification.level).toBe('info');
  });

  it('maps the wire type to the level and keeps the permanent flag', () => {
    expect(toNotifyCommand({ message: 'careful', type: 'warn', permanent: false })).toEqual({
      notification: { message: 'careful', level: 'warn', permanent: false }
    });
  });

  it('maps a pan and leaves what is not given unset', () => {
    const { pan } = toPanCanvasCommand({ x: 50 });

    expect(pan.x).toBe(50);
    expect(pan.y).toBeUndefined();
    expect(pan.scale).toBeUndefined();
    expect(pan.duration).toBeUndefined();
  });

  it('maps a ping with its options', () => {
    expect(toPingLocationCommand({ x: 1, y: 2, style: 'alert', color: '#fff', duration: 900 })).toEqual({
      ping: { x: 1, y: 2, style: 'alert', color: '#fff', duration: 900 }
    });
  });
});
