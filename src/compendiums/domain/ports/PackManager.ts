import type { PackConfigurationChange, PackInfo, WorldPackDraft } from '@/compendiums/domain/model';

export interface PackManager {
  /** The pack document types this Foundry version supports. */
  supportedDocumentTypes(): readonly string[];

  readPackInfo(packId: string): PackInfo | null;

  /** The id the core gives a new world pack with this label (`world.<slug>`). */
  plannedWorldPackId(label: string): string;

  /** Returns the new pack's id, or null when the core created nothing. */
  createWorldPack(draft: WorldPackDraft): Promise<string | null>;

  /** Copies any pack into a new world pack; returns its id, or null when the core created nothing. */
  duplicatePack(packId: string, label: string): Promise<string | null>;

  deleteWorldPack(packId: string): Promise<void>;

  configurePack(packId: string, change: PackConfigurationChange): Promise<void>;
}
