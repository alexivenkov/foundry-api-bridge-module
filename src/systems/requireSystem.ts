import { UnsupportedOperationError } from '@/systems/shared/domain/errors';
import { resolveSystemId } from './resolveSystemId';

/**
 * Guard for system-namespaced commands. Each `<system>/<method>` handler calls
 * this first: if the active world's game system differs from the command's
 * system, it throws so the caller gets a clear "not supported by this system"
 * error instead of cross-system behaviour.
 */
export function requireSystem(expected: string, operation: string): void {
  const actual = resolveSystemId();
  if (actual !== expected) {
    throw new UnsupportedOperationError(operation, actual);
  }
}
