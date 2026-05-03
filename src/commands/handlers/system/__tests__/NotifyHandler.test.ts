import { notifyHandler } from '../NotifyHandler';

interface MockNotifications {
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  success?: jest.Mock;
}

interface MockUi {
  notifications: MockNotifications;
}

const createMockUi = (withSuccess: boolean): MockUi => {
  const notifications: MockNotifications = {
    info: jest.fn().mockReturnValue(1),
    warn: jest.fn().mockReturnValue(2),
    error: jest.fn().mockReturnValue(3)
  };
  if (withSuccess) {
    notifications.success = jest.fn().mockReturnValue(4);
  }
  return { notifications };
};

describe('notifyHandler', () => {
  let mockUi: MockUi;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['ui'];
  });

  it('defaults to info type', async () => {
    mockUi = createMockUi(true);
    (globalThis as Record<string, unknown>)['ui'] = mockUi;

    const result = await notifyHandler({ message: 'hello' });

    expect(mockUi.notifications.info).toHaveBeenCalledWith('hello', {});
    expect(result).toEqual({ shown: true, type: 'info' });
  });

  it('uses warn notification', async () => {
    mockUi = createMockUi(true);
    (globalThis as Record<string, unknown>)['ui'] = mockUi;

    const result = await notifyHandler({ message: 'careful', type: 'warn' });

    expect(mockUi.notifications.warn).toHaveBeenCalledWith('careful', {});
    expect(mockUi.notifications.info).not.toHaveBeenCalled();
    expect(result.type).toBe('warn');
  });

  it('uses error notification', async () => {
    mockUi = createMockUi(true);
    (globalThis as Record<string, unknown>)['ui'] = mockUi;

    const result = await notifyHandler({ message: 'broken', type: 'error' });

    expect(mockUi.notifications.error).toHaveBeenCalledWith('broken', {});
    expect(result.type).toBe('error');
  });

  it('uses success notification when available', async () => {
    mockUi = createMockUi(true);
    (globalThis as Record<string, unknown>)['ui'] = mockUi;

    const result = await notifyHandler({ message: 'yay', type: 'success' });

    expect(mockUi.notifications.success).toHaveBeenCalledWith('yay', {});
    expect(mockUi.notifications.info).not.toHaveBeenCalled();
    expect(result.type).toBe('success');
  });

  it('falls back to info when success is not available', async () => {
    mockUi = createMockUi(false);
    (globalThis as Record<string, unknown>)['ui'] = mockUi;

    const result = await notifyHandler({ message: 'yay', type: 'success' });

    expect(mockUi.notifications.info).toHaveBeenCalledWith('yay', {});
    expect(result.type).toBe('success');
  });

  it('passes permanent flag through', async () => {
    mockUi = createMockUi(true);
    (globalThis as Record<string, unknown>)['ui'] = mockUi;

    await notifyHandler({ message: 'sticky', type: 'info', permanent: true });

    expect(mockUi.notifications.info).toHaveBeenCalledWith('sticky', { permanent: true });
  });

  it('omits permanent when not provided', async () => {
    mockUi = createMockUi(true);
    (globalThis as Record<string, unknown>)['ui'] = mockUi;

    await notifyHandler({ message: 'normal' });

    expect(mockUi.notifications.info).toHaveBeenCalledWith('normal', {});
  });
});
