// One base class for the whole module, so `instanceof DomainError` holds for
// errors of every context. Systems import it from here, not from the kernel.
export { DomainError } from '@/kernel/domain/errors';
