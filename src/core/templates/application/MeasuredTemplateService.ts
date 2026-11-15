import { CoreFeatureUnavailableError, requireScene, type SceneLocator } from '@/core/shared';
import {
  TemplateAuthorNotFoundError,
  TemplateCreationFailedError,
  TemplateNotFoundError,
  completeTemplateShape,
  findTemplateUnavailability,
  type MeasuredTemplate,
  type MeasuredTemplateStore,
  type TemplateAuthors
} from '@/core/templates/domain';
import type {
  CreateTemplateCommand,
  DeleteTemplateCommand,
  ListTemplatesQuery,
  SceneTemplateResult,
  TemplateDeletionResult,
  TemplateListResult,
  UpdateTemplateCommand
} from './commands';

export interface MeasuredTemplateServiceDependencies {
  readonly scenes: SceneLocator;
  readonly templates: MeasuredTemplateStore;
  readonly authors: TemplateAuthors;
}

export class MeasuredTemplateService {
  constructor(private readonly deps: MeasuredTemplateServiceDependencies) {}

  listTemplates(query: ListTemplatesQuery): TemplateListResult {
    this.requireAvailable();
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { sceneId: scene.id, templates: this.deps.templates.listTemplates(scene.id) };
  }

  async createTemplate(command: CreateTemplateCommand): Promise<SceneTemplateResult> {
    this.requireAvailable();
    const { draft } = command;
    const scene = requireScene(this.deps.scenes, command.sceneId);
    if (draft.authorId !== undefined && !this.deps.authors.exists(draft.authorId)) {
      throw new TemplateAuthorNotFoundError(draft.authorId);
    }
    const completion = completeTemplateShape(
      { type: draft.type, angle: draft.angle ?? 0, width: draft.width ?? 0 },
      this.deps.templates.toolDefaults(scene.id)
    );
    const template = await this.deps.templates.createTemplate(scene.id, { ...draft, ...completion });
    if (template === null) {
      throw new TemplateCreationFailedError();
    }
    return { sceneId: scene.id, template };
  }

  async updateTemplate(command: UpdateTemplateCommand): Promise<SceneTemplateResult> {
    this.requireAvailable();
    const { changes } = command;
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const current = this.requireTemplate(scene.id, command.templateId);
    const completion = completeTemplateShape(
      {
        type: changes.type ?? current.type,
        angle: changes.angle ?? current.angle,
        width: changes.width ?? current.width
      },
      this.deps.templates.toolDefaults(scene.id)
    );
    const template = await this.deps.templates.updateTemplate(scene.id, command.templateId, {
      ...changes,
      ...completion
    });
    if (template === null) {
      throw new TemplateNotFoundError(command.templateId);
    }
    return { sceneId: scene.id, template };
  }

  async deleteTemplate(command: DeleteTemplateCommand): Promise<TemplateDeletionResult> {
    this.requireAvailable();
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.requireTemplate(scene.id, command.templateId);
    await this.deps.templates.deleteTemplate(scene.id, command.templateId);
    return { sceneId: scene.id, templateId: command.templateId };
  }

  private requireAvailable(): void {
    const refusal = findTemplateUnavailability(this.deps.templates.capabilities());
    if (refusal !== null) {
      throw new CoreFeatureUnavailableError(refusal);
    }
  }

  private requireTemplate(sceneId: string, templateId: string): MeasuredTemplate {
    const template = this.deps.templates.findTemplate(sceneId, templateId);
    if (template === null) {
      throw new TemplateNotFoundError(templateId);
    }
    return template;
  }
}
