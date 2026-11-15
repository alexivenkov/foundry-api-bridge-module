import { CoreFeatureUnavailableError, NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import { TemplateAuthorNotFoundError, TemplateCreationFailedError, TemplateNotFoundError } from '../../domain';
import { MeasuredTemplateService } from '../MeasuredTemplateService';
import { FakeAuthors, FakeSceneLocator, FakeTemplateStore, template } from './fakePorts';

function setup(options: { active?: string | null; store?: FakeTemplateStore } = {}): {
  service: MeasuredTemplateService;
  store: FakeTemplateStore;
} {
  const store =
    options.store ??
    new FakeTemplateStore({
      dungeon: [template({ id: 'fireball' }), template({ id: 'breath', type: 'cone', angle: 90, distance: 30 })]
    });
  const scenes = new FakeSceneLocator(['dungeon', 'tavern'], options.active === undefined ? 'dungeon' : options.active);
  return {
    service: new MeasuredTemplateService({ scenes, templates: store, authors: new FakeAuthors(['gmgmgmgmgmgmgmgm']) }),
    store
  };
}

describe('MeasuredTemplateService', () => {
  describe('availability', () => {
    it('refuses every command on Foundry 14, which merged templates into regions', async () => {
      const store = new FakeTemplateStore({ dungeon: [template()] });
      store.caps = { supported: true, mergedIntoRegions: true };
      const { service } = setup({ store });
      const refusal = new CoreFeatureUnavailableError(
        'Measured templates are not available in Foundry 14 or newer; use regions'
      );

      expect(() => service.listTemplates({ sceneId: undefined })).toThrow(refusal);
      await expect(
        service.createTemplate({ sceneId: undefined, draft: { type: 'circle', x: 0, y: 0, distance: 5 } })
      ).rejects.toThrow(refusal);
      await expect(service.updateTemplate({ sceneId: undefined, templateId: 'm1', changes: {} })).rejects.toThrow(refusal);
      await expect(service.deleteTemplate({ sceneId: undefined, templateId: 'm1' })).rejects.toThrow(refusal);
      expect(store.created).toEqual([]);
    });

    it('refuses before Foundry 12', () => {
      const store = new FakeTemplateStore();
      store.caps = { supported: false, mergedIntoRegions: false };

      expect(() => setup({ store }).service.listTemplates({ sceneId: undefined })).toThrow(
        'Measured template commands require Foundry 12 or newer'
      );
    });
  });

  describe('listTemplates', () => {
    it('lists the active scene, or the named one', () => {
      const { service } = setup();

      expect(service.listTemplates({ sceneId: undefined }).templates.map((t) => t.id)).toEqual(['fireball', 'breath']);
      expect(service.listTemplates({ sceneId: 'tavern' })).toEqual({ sceneId: 'tavern', templates: [] });
    });

    it('rejects an unknown scene and a missing active scene', () => {
      expect(() => setup().service.listTemplates({ sceneId: 'missing' })).toThrow(SceneNotFoundError);
      expect(() => setup({ active: null }).service.listTemplates({ sceneId: undefined })).toThrow(NoActiveSceneError);
    });
  });

  describe('createTemplate', () => {
    it('creates a circle as given', async () => {
      const { service, store } = setup();
      const draft = { type: 'circle' as const, x: 100, y: 200, distance: 20, fillColor: '#ff0000' };

      const result = await service.createTemplate({ sceneId: 'tavern', draft });

      expect(store.created).toEqual([{ sceneId: 'tavern', draft }]);
      expect(result).toEqual({ sceneId: 'tavern', template: template({ id: 'created', distance: 20 }) });
    });

    it('gives a cone and a ray what the template tools would', async () => {
      const { service, store } = setup();

      await service.createTemplate({ sceneId: undefined, draft: { type: 'cone', x: 0, y: 0, distance: 15 } });
      await service.createTemplate({ sceneId: undefined, draft: { type: 'ray', x: 0, y: 0, distance: 60 } });
      await service.createTemplate({ sceneId: undefined, draft: { type: 'cone', x: 0, y: 0, distance: 15, angle: 90 } });

      expect(store.created.map((entry) => entry.draft)).toEqual([
        { type: 'cone', x: 0, y: 0, distance: 15, angle: 53.13 },
        { type: 'ray', x: 0, y: 0, distance: 60, width: 5 },
        { type: 'cone', x: 0, y: 0, distance: 15, angle: 90 }
      ]);
    });

    it('checks an explicit author', async () => {
      await expect(
        setup().service.createTemplate({
          sceneId: undefined,
          draft: { type: 'circle', x: 0, y: 0, distance: 5, authorId: 'nobodynobody0000' }
        })
      ).rejects.toThrow(new TemplateAuthorNotFoundError('nobodynobody0000'));
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      await expect(
        service.createTemplate({ sceneId: undefined, draft: { type: 'circle', x: 0, y: 0, distance: 5 } })
      ).rejects.toThrow(new TemplateCreationFailedError());
    });
  });

  describe('updateTemplate', () => {
    it('applies a partial change', async () => {
      const { service, store } = setup();

      const result = await service.updateTemplate({ sceneId: undefined, templateId: 'breath', changes: { distance: 60 } });

      expect(store.updated).toEqual([{ sceneId: 'dungeon', templateId: 'breath', changes: { distance: 60 } }]);
      expect(result.template.distance).toBe(60);
    });

    it('opens a circle turned into a cone', async () => {
      const { service, store } = setup();

      await service.updateTemplate({ sceneId: undefined, templateId: 'fireball', changes: { type: 'cone' } });

      expect(store.updated[0]?.changes).toEqual({ type: 'cone', angle: 53.13 });
    });

    it('rejects an unknown template, and one that vanished during the update', async () => {
      const { service, store } = setup();

      await expect(service.updateTemplate({ sceneId: undefined, templateId: 'nope', changes: {} })).rejects.toThrow(
        new TemplateNotFoundError('nope')
      );
      store.losesTemplateOnUpdate = true;
      await expect(service.updateTemplate({ sceneId: undefined, templateId: 'fireball', changes: {} })).rejects.toThrow(
        TemplateNotFoundError
      );
    });
  });

  describe('deleteTemplate', () => {
    it('deletes an existing template and rejects an unknown one', async () => {
      const { service, store } = setup();

      await expect(service.deleteTemplate({ sceneId: 'dungeon', templateId: 'fireball' })).resolves.toEqual({
        sceneId: 'dungeon',
        templateId: 'fireball'
      });
      expect(store.deleted).toEqual([{ sceneId: 'dungeon', templateId: 'fireball' }]);
      await expect(service.deleteTemplate({ sceneId: undefined, templateId: 'nope' })).rejects.toThrow(
        'Template not found: nope'
      );
    });
  });
});
