import { DomainError } from '../../../../kernel';
import { CanvasUnavailableError, NOTIFICATION_LEVELS, NotificationsUnavailableError } from '..';

describe('ui errors carry the wire texts', () => {
  it.each([
    [new NotificationsUnavailableError(), 'UI notifications not available'],
    [new CanvasUnavailableError(), 'Canvas not available']
  ])('%s', (error, text) => {
    expect(error.message).toBe(text);
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('notification levels', () => {
  it('are the four the wire knows', () => {
    expect(NOTIFICATION_LEVELS).toEqual(['info', 'warn', 'error', 'success']);
  });
});
