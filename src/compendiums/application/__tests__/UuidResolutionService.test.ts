import { UuidNotResolvedError } from '../../domain';
import type { ResolvedUuidRecord, UuidResolver } from '../../domain';
import { UuidResolutionService } from '../UuidResolutionService';

const record: ResolvedUuidRecord = {
  uuid: 'Actor.a1',
  documentName: 'Actor',
  id: 'a1',
  name: 'Hero',
  type: 'character',
  img: null,
  pack: null,
  parentUuid: null,
  data: { name: 'Hero' }
};

function makeService(result: ResolvedUuidRecord | null): UuidResolutionService {
  const resolver: UuidResolver = { resolve: () => Promise.resolve(result) };
  return new UuidResolutionService({ resolver });
}

describe('UuidResolutionService', () => {
  it('returns the resolved record', async () => {
    expect(await makeService(record).resolve('Actor.a1')).toEqual(record);
  });

  it('throws UuidNotResolvedError with the canonical text when unresolved', async () => {
    await expect(makeService(null).resolve('Actor.ghost')).rejects.toThrow(
      UuidNotResolvedError
    );
    await expect(makeService(null).resolve('Actor.ghost')).rejects.toThrow(
      'Document not found for UUID: Actor.ghost'
    );
  });
});
