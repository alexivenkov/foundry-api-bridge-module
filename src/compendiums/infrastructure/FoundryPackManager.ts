import { CompendiumFeatureUnavailableError } from '@/compendiums/domain';
import type { PackConfigurationChange, PackInfo, PackManager, WorldPackDraft } from '@/compendiums/domain';
import type {
  FoundryManagedPack,
  PackManagementGameProvider,
  PackManagementGlobals
} from './foundryPackManagementTypes';
import { toPackInfo } from './packInfoMapper';
import { toCoreOwnership } from './packOwnershipCodes';

const WORLD_PACKAGE = 'world';

// Pack creation, duplication and deletion go through the server's
// `manageCompendium` socket (`CompendiumCollection.createCompendium`,
// `#duplicateCompendium`, `#deleteCompendium`); lock, ownership and folder
// live in the `core.compendiumConfiguration` world setting (`#configure`).
export class FoundryPackManager implements PackManager {
  constructor(
    private readonly gameProvider: PackManagementGameProvider,
    private readonly globals: PackManagementGlobals
  ) {}

  supportedDocumentTypes(): readonly string[] {
    return this.globals.compendiumDocumentTypes();
  }

  readPackInfo(packId: string): PackInfo | null {
    const pack = this.findPack(packId);
    return pack ? toPackInfo(pack) : null;
  }

  plannedWorldPackId(label: string): string {
    return `${WORLD_PACKAGE}.${this.globals.slugify(label)}`;
  }

  async createWorldPack(draft: WorldPackDraft): Promise<string | null> {
    const compendiumClass = this.globals.compendiumCollectionClass();
    if (!compendiumClass) {
      throw new CompendiumFeatureUnavailableError('Compendium creation is not available in this Foundry version');
    }
    const created = await compendiumClass.createCompendium({ label: draft.label, type: draft.documentType });
    return packIdOf(created);
  }

  async duplicatePack(packId: string, label: string): Promise<string | null> {
    const pack = this.findPack(packId);
    if (!pack) return null;
    return packIdOf(await pack.duplicateCompendium({ label }));
  }

  async deleteWorldPack(packId: string): Promise<void> {
    await this.findPack(packId)?.deleteCompendium();
  }

  async configurePack(packId: string, change: PackConfigurationChange): Promise<void> {
    const pack = this.findPack(packId);
    if (!pack) return;

    // `configure` deletes a key whose value is undefined, which resets ownership.
    const configuration: Record<string, unknown> = {};
    if (change.locked !== undefined) {
      configuration['locked'] = change.locked;
    }
    if (change.ownership !== undefined) {
      configuration['ownership'] = change.ownership === null ? undefined : toCoreOwnership(change.ownership);
    }
    if (change.folderId !== undefined) {
      configuration['folder'] = change.folderId;
    }
    await pack.configure(configuration);
  }

  private findPack(packId: string): FoundryManagedPack | undefined {
    return this.gameProvider.getGame().packs.get(packId);
  }
}

// A non-GM call resolves to a notification instead of the new pack.
function packIdOf(created: unknown): string | null {
  if (typeof created !== 'object' || created === null) return null;
  const collection = (created as { collection?: unknown }).collection;
  return typeof collection === 'string' ? collection : null;
}
