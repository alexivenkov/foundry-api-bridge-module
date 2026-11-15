import { foundryGeneration } from '@/compat/foundryVersion';
import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import type {
  MeasuredTemplate,
  MeasuredTemplateChanges,
  MeasuredTemplateDraft,
  MeasuredTemplateStore,
  TemplateAuthors,
  TemplateCapabilities,
  TemplateToolDefaults
} from '@/core/templates/domain';
import type { FoundryTemplateConfig, FoundryTemplateGame, FoundryTemplateScene } from './foundryTemplateTypes';
import { toFoundryTemplateData, toMeasuredTemplate } from './templateMapper';

export type TemplateGameProvider = GameProvider<FoundryTemplateGame>;
export type TemplateConfigProvider = () => FoundryTemplateConfig | undefined;

// Foundry 12 renamed the template's `user` to `author` and added elevation and
// sort. Foundry 14 removed the document: `Scene#templates` survives only as a
// deprecated, lossy view over regions, so the commands are refused there.
const FIRST_SUPPORTED_GENERATION = 12;
const FIRST_REGION_GENERATION = 14;

// CONFIG.MeasuredTemplate.defaults of Foundry 13.351 (a game system may change them).
const CORE_CONE_ANGLE = 53.13;
const CORE_RAY_WIDTH_IN_SQUARES = 1;
const CORE_GRID_DISTANCE = 5;

const fromGlobalConfig: TemplateConfigProvider = () =>
  (globalThis as { CONFIG?: FoundryTemplateConfig }).CONFIG;

/** Anti-corruption layer over a scene's embedded MeasuredTemplate documents. */
export class FoundryMeasuredTemplateStore implements MeasuredTemplateStore, TemplateAuthors {
  constructor(
    private readonly gameProvider: TemplateGameProvider,
    private readonly config: TemplateConfigProvider = fromGlobalConfig
  ) {}

  capabilities(): TemplateCapabilities {
    const generation = foundryGeneration();
    return {
      supported: generation >= FIRST_SUPPORTED_GENERATION,
      mergedIntoRegions: generation >= FIRST_REGION_GENERATION
    };
  }

  /** As the template tools do: a ray is `defaults.width` grid squares wide. */
  toolDefaults(sceneId: string): TemplateToolDefaults {
    const defaults = this.config()?.MeasuredTemplate?.defaults;
    const gridDistance = this.requireScene(sceneId).grid?.distance ?? CORE_GRID_DISTANCE;
    return {
      coneAngle: defaults?.angle ?? CORE_CONE_ANGLE,
      rayWidth: (defaults?.width ?? CORE_RAY_WIDTH_IN_SQUARES) * gridDistance
    };
  }

  exists(userId: string): boolean {
    return this.gameProvider.getGame().users.get(userId) !== undefined;
  }

  listTemplates(sceneId: string): readonly MeasuredTemplate[] {
    return this.requireScene(sceneId).templates.contents.map((document) => toMeasuredTemplate(document._source));
  }

  findTemplate(sceneId: string, templateId: string): MeasuredTemplate | null {
    const document = this.requireScene(sceneId).templates.get(templateId);
    return document !== undefined ? toMeasuredTemplate(document._source) : null;
  }

  async createTemplate(sceneId: string, draft: MeasuredTemplateDraft): Promise<MeasuredTemplate | null> {
    const created = await this.requireScene(sceneId).createEmbeddedDocuments('MeasuredTemplate', [
      toFoundryTemplateData(draft)
    ]);
    const document = created[0];
    return document !== undefined ? toMeasuredTemplate(document._source) : null;
  }

  async updateTemplate(
    sceneId: string,
    templateId: string,
    changes: MeasuredTemplateChanges
  ): Promise<MeasuredTemplate | null> {
    const document = this.requireScene(sceneId).templates.get(templateId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryTemplateData(changes));
    return toMeasuredTemplate(document._source);
  }

  async deleteTemplate(sceneId: string, templateId: string): Promise<void> {
    await this.requireScene(sceneId).deleteEmbeddedDocuments('MeasuredTemplate', [templateId]);
  }

  private requireScene(sceneId: string): FoundryTemplateScene {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return scene;
  }
}
