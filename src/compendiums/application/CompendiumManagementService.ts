import {
  PackAlreadyExistsError,
  PackCreationFailedError,
  PackNotDeletableError,
  PackNotFoundError,
  PackTypeUnsupportedError,
  defaultDuplicateLabel,
  mergePackOwnership
} from '@/compendiums/domain';
import type { PackInfo, PackManager, WorldDirectory } from '@/compendiums/domain';
import type {
  ConfigurePackCommand,
  CreatePackCommand,
  DeletedPack,
  DuplicatePackCommand
} from './managementCommands';
import { requirePackInfo, requireUnlockedPack, requireWorldFolder } from './packGuards';

const COMPENDIUM_FOLDER_TYPE = 'Compendium';

export interface CompendiumManagementServiceDependencies {
  readonly packs: PackManager;
  readonly world: WorldDirectory;
}

export class CompendiumManagementService {
  constructor(private readonly deps: CompendiumManagementServiceDependencies) {}

  getInfo(packId: string): PackInfo {
    return requirePackInfo(this.deps.packs, packId);
  }

  async create(command: CreatePackCommand): Promise<PackInfo> {
    if (!this.deps.packs.supportedDocumentTypes().includes(command.documentType)) {
      throw new PackTypeUnsupportedError(command.documentType);
    }
    this.requireCompendiumFolder(command.folderId);
    this.requireFreeWorldPackId(command.label);

    const packId = await this.deps.packs.createWorldPack({
      label: command.label,
      documentType: command.documentType
    });
    if (packId === null) {
      throw new PackCreationFailedError(command.label);
    }
    return this.finishNewPack(packId, command.folderId);
  }

  async duplicate(command: DuplicatePackCommand): Promise<PackInfo> {
    const source = requirePackInfo(this.deps.packs, command.packId);
    const label = command.label ?? defaultDuplicateLabel(source.label);
    this.requireCompendiumFolder(command.folderId);
    this.requireFreeWorldPackId(label);

    const packId = await this.deps.packs.duplicatePack(source.id, label);
    if (packId === null) {
      throw new PackCreationFailedError(label);
    }
    return this.finishNewPack(packId, command.folderId);
  }

  async configure(command: ConfigurePackCommand): Promise<PackInfo> {
    const current = requirePackInfo(this.deps.packs, command.packId);
    if (typeof command.folderId === 'string') {
      this.requireCompendiumFolder(command.folderId);
    }

    const ownership =
      command.ownership === undefined || command.ownership === null
        ? command.ownership
        : mergePackOwnership(current.ownership, command.ownership);
    if (command.locked !== undefined || ownership !== undefined || command.folderId !== undefined) {
      await this.deps.packs.configurePack(current.id, {
        locked: command.locked,
        ownership,
        folderId: command.folderId
      });
    }
    return requirePackInfo(this.deps.packs, current.id);
  }

  async delete(packId: string): Promise<DeletedPack> {
    const info = requirePackInfo(this.deps.packs, packId);
    if (info.packageType !== 'world') {
      throw new PackNotDeletableError(packId, info.packageType, info.packageName);
    }
    requireUnlockedPack(this.deps.packs, packId);

    await this.deps.packs.deleteWorldPack(packId);
    return { packId, label: info.label, documentCount: info.documentCount };
  }

  private requireCompendiumFolder(folderId: string | undefined): void {
    if (folderId !== undefined) {
      requireWorldFolder(this.deps.world, folderId, COMPENDIUM_FOLDER_TYPE);
    }
  }

  private requireFreeWorldPackId(label: string): void {
    const plannedId = this.deps.packs.plannedWorldPackId(label);
    if (this.deps.packs.readPackInfo(plannedId) !== null) {
      throw new PackAlreadyExistsError(plannedId);
    }
  }

  private async finishNewPack(packId: string, folderId: string | undefined): Promise<PackInfo> {
    if (folderId !== undefined) {
      await this.deps.packs.configurePack(packId, { folderId });
    }
    const info = this.deps.packs.readPackInfo(packId);
    if (info === null) {
      throw new PackNotFoundError(packId);
    }
    return info;
  }
}
