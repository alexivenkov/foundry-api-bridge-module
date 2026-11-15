import type { SceneIdentity, SceneLocator } from '../../../shared';
import type {
  MeasuredTemplate,
  MeasuredTemplateChanges,
  MeasuredTemplateDraft,
  MeasuredTemplateStore,
  TemplateAuthors,
  TemplateCapabilities,
  TemplateToolDefaults
} from '../../domain';

export function template(overrides: Partial<MeasuredTemplate> = {}): MeasuredTemplate {
  return {
    id: 'm1',
    authorId: 'gmgmgmgmgmgmgmgm',
    type: 'circle',
    x: 0,
    y: 0,
    elevation: 0,
    sort: 0,
    distance: 20,
    direction: 0,
    angle: 0,
    width: 0,
    borderColor: '#000000',
    fillColor: '#aa33cc',
    texture: null,
    hidden: false,
    ...overrides
  };
}

export class FakeSceneLocator implements SceneLocator {
  constructor(
    private readonly sceneIds: readonly string[],
    private readonly activeId: string | null
  ) {}

  findScene(sceneId: string): SceneIdentity | null {
    return this.sceneIds.includes(sceneId) ? { id: sceneId, name: sceneId } : null;
  }

  findActiveScene(): SceneIdentity | null {
    return this.activeId !== null ? { id: this.activeId, name: this.activeId } : null;
  }
}

export class FakeAuthors implements TemplateAuthors {
  constructor(private readonly userIds: readonly string[]) {}

  exists(userId: string): boolean {
    return this.userIds.includes(userId);
  }
}

export class FakeTemplateStore implements MeasuredTemplateStore {
  readonly created: Array<{ sceneId: string; draft: MeasuredTemplateDraft }> = [];
  readonly updated: Array<{ sceneId: string; templateId: string; changes: MeasuredTemplateChanges }> = [];
  readonly deleted: Array<{ sceneId: string; templateId: string }> = [];
  createsNothing = false;
  losesTemplateOnUpdate = false;
  caps: TemplateCapabilities = { supported: true, mergedIntoRegions: false };
  defaults: TemplateToolDefaults = { coneAngle: 53.13, rayWidth: 5 };

  private readonly byScene = new Map<string, MeasuredTemplate[]>();

  constructor(templates: Readonly<Record<string, readonly MeasuredTemplate[]>> = {}) {
    for (const [sceneId, sceneTemplates] of Object.entries(templates)) {
      this.byScene.set(sceneId, [...sceneTemplates]);
    }
  }

  capabilities(): TemplateCapabilities {
    return this.caps;
  }

  toolDefaults(): TemplateToolDefaults {
    return this.defaults;
  }

  listTemplates(sceneId: string): readonly MeasuredTemplate[] {
    return this.byScene.get(sceneId) ?? [];
  }

  findTemplate(sceneId: string, templateId: string): MeasuredTemplate | null {
    return this.listTemplates(sceneId).find((candidate) => candidate.id === templateId) ?? null;
  }

  createTemplate(sceneId: string, draft: MeasuredTemplateDraft): Promise<MeasuredTemplate | null> {
    this.created.push({ sceneId, draft });
    return Promise.resolve(
      this.createsNothing ? null : template({ id: 'created', type: draft.type, distance: draft.distance })
    );
  }

  updateTemplate(sceneId: string, templateId: string, changes: MeasuredTemplateChanges): Promise<MeasuredTemplate | null> {
    this.updated.push({ sceneId, templateId, changes });
    const current = this.findTemplate(sceneId, templateId);
    if (current === null || this.losesTemplateOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...current, distance: changes.distance ?? current.distance });
  }

  deleteTemplate(sceneId: string, templateId: string): Promise<void> {
    this.deleted.push({ sceneId, templateId });
    return Promise.resolve();
  }
}
