import type {
  MeasuredTemplate,
  MeasuredTemplateChanges,
  MeasuredTemplateDraft
} from '@/core/templates/domain';

export interface ListTemplatesQuery {
  readonly sceneId: string | undefined;
}

export interface CreateTemplateCommand {
  readonly sceneId: string | undefined;
  readonly draft: MeasuredTemplateDraft;
}

export interface UpdateTemplateCommand {
  readonly sceneId: string | undefined;
  readonly templateId: string;
  readonly changes: MeasuredTemplateChanges;
}

export interface DeleteTemplateCommand {
  readonly sceneId: string | undefined;
  readonly templateId: string;
}

export interface TemplateListResult {
  readonly sceneId: string;
  readonly templates: readonly MeasuredTemplate[];
}

export interface SceneTemplateResult {
  readonly sceneId: string;
  readonly template: MeasuredTemplate;
}

export interface TemplateDeletionResult {
  readonly sceneId: string;
  readonly templateId: string;
}
