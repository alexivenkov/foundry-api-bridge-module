import { foundryGeneration } from '@/compat/foundryVersion';
import type { DocumentExporter, DocumentReference } from '@/core/documents/domain';
import { toDocumentReference, toPlainRecord } from './documentMapper';
import { FoundryDocumentResolver } from './FoundryDocumentResolver';
import type { DocumentGlobalsProvider, FoundryDocument } from './foundryDocumentTypes';

/**
 * What `ClientDocumentMixin#exportToJSON` ("Export Data") writes, without its browser download:
 * `toCompendium(null, {clearSource: false})` — no id, sort, explicit user ownership or `active` state — stamped
 * with the export source. Foundry 12 moved that stamp from `flags.exportSource` to `_stats.exportSource`.
 */
export class FoundryDocumentExporter implements DocumentExporter {
  private readonly resolver: FoundryDocumentResolver;

  constructor(
    private readonly globals: DocumentGlobalsProvider,
    private readonly generation: () => number = foundryGeneration
  ) {
    this.resolver = new FoundryDocumentResolver(globals);
  }

  async findDocument(uuid: string): Promise<DocumentReference | null> {
    const document = await this.resolver.resolve(uuid);
    return document !== null ? toDocumentReference(document) : null;
  }

  async exportDocument(uuid: string): Promise<Readonly<Record<string, unknown>> | null> {
    const document = await this.resolver.resolve(uuid);
    if (document === null) {
      return null;
    }
    const data = toPlainRecord(document.toCompendium(null, { clearSource: false }));
    this.stampExportSource(data, document);
    return data;
  }

  private stampExportSource(data: Record<string, unknown>, document: FoundryDocument): void {
    const { game } = this.globals();
    if (this.generation() >= 12) {
      data['_stats'] = {
        ...toPlainRecord(data['_stats']),
        exportSource: {
          worldId: game.world.id,
          uuid: document.uuid,
          coreVersion: game.version,
          systemId: game.system.id,
          systemVersion: game.system.version
        }
      };
      return;
    }
    data['flags'] = {
      ...toPlainRecord(data['flags']),
      exportSource: {
        world: game.world.id,
        system: game.system.id,
        coreVersion: game.version,
        systemVersion: game.system.version
      }
    };
  }
}
