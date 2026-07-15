import { UuidNotResolvedError } from '@/compendiums/domain';
import type { ResolvedUuidRecord, UuidResolver } from '@/compendiums/domain';

export interface UuidResolutionServiceDependencies {
  readonly resolver: UuidResolver;
}

export class UuidResolutionService {
  constructor(private readonly deps: UuidResolutionServiceDependencies) {}

  async resolve(uuid: string): Promise<ResolvedUuidRecord> {
    const record = await this.deps.resolver.resolve(uuid);
    if (record === null) {
      throw new UuidNotResolvedError(uuid);
    }
    return record;
  }
}

export function createUuidResolutionService(
  deps: UuidResolutionServiceDependencies
): UuidResolutionService {
  return new UuidResolutionService(deps);
}
