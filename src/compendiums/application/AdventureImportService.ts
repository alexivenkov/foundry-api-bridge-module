import {
  AdventureContentTypeUnavailableError,
  AdventureImportPreventedError,
  AdventureOverwriteRefusedError,
  CompendiumFeatureUnavailableError,
  NO_SCRIPT_CONSENT,
  PackDocumentNotFoundError,
  PackTypeMismatchError,
  adventureContents,
  countDocuments,
  plansMacros,
  summarizeGroups,
  withoutMacros
} from '@/compendiums/domain';
import type {
  AdventureGateway,
  AdventureHeader,
  AdventureImportPlan,
  PackManager,
  ScriptMacroImportPolicy,
  WorldDocumentRef
} from '@/compendiums/domain';
import type {
  AdventureDetails,
  GetAdventureQuery,
  ImportAdventureCommand,
  ImportedAdventure
} from './managementCommands';
import { requirePackInfo } from './packGuards';

const ADVENTURE = 'Adventure';

export interface AdventureImportServiceDependencies {
  readonly packs: PackManager;
  readonly adventures: AdventureGateway;
  /** Absent: script macros are skipped. */
  readonly scripts?: ScriptMacroImportPolicy | undefined;
}

export class AdventureImportService {
  constructor(private readonly deps: AdventureImportServiceDependencies) {}

  async getAdventure(query: GetAdventureQuery): Promise<AdventureDetails> {
    const header = await this.requireAdventure(query.packId, query.adventureId);
    const plan = await this.deps.adventures.planImport(query.packId, query.adventureId);
    const contents = adventureContents(plan);
    return {
      ...header,
      packId: query.packId,
      contents,
      totalCount: countDocuments(plan.toCreate) + countDocuments(plan.toUpdate),
      existingCount: countDocuments(plan.toUpdate)
    };
  }

  async importAdventure(command: ImportAdventureCommand): Promise<ImportedAdventure> {
    const header = await this.requireAdventure(command.packId, command.adventureId);
    const available = this.deps.adventures.contentTypes();
    for (const documentType of command.documentTypes ?? []) {
      if (!available.includes(documentType)) {
        throw new AdventureContentTypeUnavailableError(documentType);
      }
    }

    const plan = await this.deps.adventures.planImport(
      command.packId,
      command.adventureId,
      command.documentTypes
    );
    const skipped = this.scriptMacrosToSkip(plan);
    const toUpdate = skipped === undefined ? plan.toUpdate : withoutMacros(plan.toUpdate, skipped);
    const overwriteCount = countDocuments(toUpdate);
    if (overwriteCount > 0 && !command.overwrite) {
      throw new AdventureOverwriteRefusedError(header.name, overwriteCount, summarizeGroups(toUpdate));
    }

    const skipping = skipped !== undefined && skipped.length > 0;
    const outcome = await this.deps.adventures.importAdventure(command.packId, command.adventureId, {
      documentTypes: command.documentTypes,
      allowOverwrite: command.overwrite,
      ...(skipping ? { skipScriptMacros: true } : {})
    });
    if (outcome === null) {
      throw new AdventureImportPreventedError(header.name);
    }
    return {
      packId: command.packId,
      adventureId: header.id,
      name: header.name,
      created: outcome.created,
      updated: outcome.updated,
      ...(skipped === undefined ? {} : { skippedScriptMacros: skipping ? (outcome.skippedScriptMacros ?? skipped) : [] })
    };
  }

  /**
   * Without the opt-in the adventure's script macros stay behind, as `create-macro` refuses to create one;
   * undefined when nothing is skipped because the opt-in is on or the import brings no macros.
   */
  private scriptMacrosToSkip(plan: AdventureImportPlan): readonly WorldDocumentRef[] | undefined {
    if (!plansMacros(plan.toCreate) && !plansMacros(plan.toUpdate)) {
      return undefined;
    }
    return (this.deps.scripts ?? NO_SCRIPT_CONSENT).allowsScripts() ? undefined : (plan.scriptMacros ?? []);
  }

  private async requireAdventure(packId: string, adventureId: string): Promise<AdventureHeader> {
    if (!this.deps.adventures.isAvailable()) {
      throw new CompendiumFeatureUnavailableError('Adventure import is not available in this Foundry version');
    }
    const pack = requirePackInfo(this.deps.packs, packId);
    if (pack.type !== ADVENTURE) {
      throw new PackTypeMismatchError(packId, ADVENTURE, pack.type);
    }
    const header = await this.deps.adventures.readAdventure(packId, adventureId);
    if (header === null) {
      throw new PackDocumentNotFoundError(packId, adventureId);
    }
    return header;
  }
}
