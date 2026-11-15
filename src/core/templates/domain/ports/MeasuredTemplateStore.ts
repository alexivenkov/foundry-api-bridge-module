import type {
  MeasuredTemplate,
  MeasuredTemplateChanges,
  MeasuredTemplateDraft
} from '@/core/templates/domain/model/MeasuredTemplate';
import type { TemplateCapabilities } from '@/core/templates/domain/rules/templateFeatures';
import type { TemplateToolDefaults } from '@/core/templates/domain/rules/templateToolDefaults';

// Reads are synchronous: a scene's templates live in memory. `createTemplate`
// resolves to null when the core created nothing; `updateTemplate` when the
// template is gone.
export interface MeasuredTemplateStore {
  capabilities(): TemplateCapabilities;
  toolDefaults(sceneId: string): TemplateToolDefaults;
  listTemplates(sceneId: string): readonly MeasuredTemplate[];
  findTemplate(sceneId: string, templateId: string): MeasuredTemplate | null;
  createTemplate(sceneId: string, draft: MeasuredTemplateDraft): Promise<MeasuredTemplate | null>;
  updateTemplate(
    sceneId: string,
    templateId: string,
    changes: MeasuredTemplateChanges
  ): Promise<MeasuredTemplate | null>;
  deleteTemplate(sceneId: string, templateId: string): Promise<void>;
}

/** The world's users, who may author a template. */
export interface TemplateAuthors {
  exists(userId: string): boolean;
}
