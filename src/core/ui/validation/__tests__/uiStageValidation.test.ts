import {
  createProgressNotificationRequestSchema,
  measureGridPathRequestSchema,
  notifyRequestSchema,
  removeNotificationRequestSchema,
  showScrollingTextRequestSchema,
  snapToGridRequestSchema,
  toMeasureGridPathCommand,
  toNotifyCommand,
  toShowScrollingTextCommand,
  toSnapToGridCommand,
  toStartProgressCommand,
  toUpdateProgressCommand,
  updateProgressNotificationRequestSchema
} from '..';

describe('notification schemas', () => {
  it('takes console on notify, strictly', () => {
    expect(toNotifyCommand(notifyRequestSchema.parse({ message: 'm', console: false })).notification.console).toBe(false);
    expect(notifyRequestSchema.safeParse({ message: 'm', console: 'no' }).success).toBe(false);
  });

  it('validates progress requests', () => {
    expect(createProgressNotificationRequestSchema.safeParse({ message: '' }).success).toBe(false);
    expect(createProgressNotificationRequestSchema.safeParse({ message: 'm', pct: 1.5 }).success).toBe(false);
    expect(createProgressNotificationRequestSchema.safeParse({ message: 'm', type: 'loud' }).success).toBe(false);
    expect(updateProgressNotificationRequestSchema.safeParse({ notificationId: 1 }).success).toBe(false);
    expect(updateProgressNotificationRequestSchema.safeParse({ notificationId: 0, pct: 1 }).success).toBe(false);
    expect(removeNotificationRequestSchema.safeParse({ notificationId: 1.5 }).success).toBe(false);
  });

  it('maps progress requests with info as the default level', () => {
    expect(toStartProgressCommand(createProgressNotificationRequestSchema.parse({ message: 'm', pct: 0.1 }))).toEqual({
      progress: { message: 'm', level: 'info', pct: 0.1, permanent: undefined, console: undefined }
    });
    expect(toUpdateProgressCommand(updateProgressNotificationRequestSchema.parse({ notificationId: 4, pct: 1 }))).toEqual({
      notificationId: 4,
      update: { message: undefined, pct: 1 }
    });
  });
});

describe('grid schemas', () => {
  const path = [
    { x: 0, y: 0 },
    { x: 100, y: 0 }
  ];

  it('needs 2 to 100 waypoints', () => {
    expect(measureGridPathRequestSchema.safeParse({ waypoints: [{ x: 0, y: 0 }] }).success).toBe(false);
    expect(measureGridPathRequestSchema.safeParse({ waypoints: Array.from({ length: 101 }, () => ({ x: 0, y: 0 })) }).success).toBe(false);
    expect(measureGridPathRequestSchema.safeParse({ waypoints: [{ x: 0 }, { x: 1, y: 1 }] }).success).toBe(false);
  });

  it.each([null, ''])('reads sceneId %p as the active scene', (sceneId) => {
    expect(toMeasureGridPathCommand(measureGridPathRequestSchema.parse({ sceneId, waypoints: path })).sceneId).toBeUndefined();
  });

  it('takes one snapping mode or several', () => {
    expect(toSnapToGridCommand(snapToGridRequestSchema.parse({ x: 1, y: 2, mode: 'center' }))).toEqual({
      sceneId: undefined,
      point: { x: 1, y: 2 },
      snapping: { modes: ['center'], resolution: 1 }
    });
    expect(toSnapToGridCommand(snapToGridRequestSchema.parse({ x: 1, y: 2, mode: ['vertex', 'corner'], resolution: 2 })).snapping).toEqual({
      modes: ['vertex', 'corner'],
      resolution: 2
    });
  });

  it.each([
    ['an unknown mode', { x: 0, y: 0, mode: 'middle' }],
    ['an empty mode list', { x: 0, y: 0, mode: [] }],
    ['a fractional resolution', { x: 0, y: 0, mode: 'center', resolution: 1.5 }],
    ['no mode', { x: 0, y: 0 }]
  ])('rejects %s', (_case, request) => {
    expect(snapToGridRequestSchema.safeParse(request).success).toBe(false);
  });
});

describe('scrolling text schema', () => {
  it('expands a short color and maps the text', () => {
    expect(toShowScrollingTextCommand(showScrollingTextRequestSchema.parse({ x: 1, y: 2, text: 'Hit', color: '#F80' }))).toEqual({
      text: {
        origin: { x: 1, y: 2 },
        text: 'Hit',
        color: '#ff8800',
        fontSize: undefined,
        anchor: undefined,
        direction: undefined,
        duration: undefined,
        jitter: undefined
      }
    });
  });

  it.each([
    ['empty text', { text: '' }],
    ['text over 200 characters', { text: 'x'.repeat(201) }],
    ['a named color', { text: 't', color: 'red' }],
    ['a tiny font', { text: 't', fontSize: 4 }],
    ['an unknown anchor', { text: 't', anchor: 'middle' }],
    ['an endless duration', { text: 't', duration: 60_000 }],
    ['jitter above 1', { text: 't', jitter: 2 }]
  ])('rejects %s', (_case, request) => {
    expect(showScrollingTextRequestSchema.safeParse({ x: 0, y: 0, ...request }).success).toBe(false);
  });
});
