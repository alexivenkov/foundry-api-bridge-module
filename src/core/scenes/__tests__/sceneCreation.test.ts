import { createFoundrySceneSettingsService } from '../composition';
import type { FoundrySceneDocument, FoundrySceneLevel } from '../infrastructure';
import {
  clearGeneration,
  gameWith,
  level,
  levelledSceneDocument,
  sceneDocument,
  setGeneration
} from '../infrastructure/__tests__/fakeDocuments';

// The service and the Foundry gateway together, as `create-scene` uses them:
// what reaches the core when a scene is created with images, and what comes back.

interface Creation {
  create: jest.Mock;
  update: jest.Mock;
  service: ReturnType<typeof createFoundrySceneSettingsService>;
}

/** A world in which `Scene.create` answers with the given document and adds it to the scenes. */
function worldCreating(created: FoundrySceneDocument): Creation {
  const game = gameWith(created);
  const create = jest.fn().mockResolvedValue(created);
  const service = createFoundrySceneSettingsService({ gameProvider: { getGame: () => game }, sceneClass: () => ({ create }) });
  return { create, update: created.update as jest.Mock, service };
}

/** A level whose images follow the updates the scene receives, as the core's would. */
function livingLevel(images: Pick<FoundrySceneLevel, 'background' | 'foreground'>): {
  firstLevel: FoundrySceneLevel;
  scene: FoundrySceneDocument;
} {
  const firstLevel = level({ id: 'defaultLevel0000', ...images });
  const scene = levelledSceneDocument(firstLevel, { id: 'crypt', uuid: 'Scene.crypt', name: 'Crypt' });
  (scene.update as jest.Mock).mockImplementation((data: { levels?: Array<Partial<FoundrySceneLevel>> }) => {
    Object.assign(firstLevel, data.levels?.[0]);
    return Promise.resolve(scene);
  });
  return { firstLevel, scene };
}

const draft = { name: 'Crypt', backgroundSrc: 'maps/crypt.webp', foregroundSrc: 'fx/fog.webp' };
const legacyPayload = { name: 'Crypt', background: { src: 'maps/crypt.webp' }, foreground: 'fx/fog.webp' };

describe('creating a scene with images', () => {
  afterEach(clearGeneration);

  describe('on Foundry 14', () => {
    beforeEach(() => {
      setGeneration(14);
    });

    it('writes them to the first level when the core dropped them from the creation', async () => {
      const { scene, firstLevel } = livingLevel({ background: { src: null }, foreground: { src: null } });
      const { create, update, service } = worldCreating(scene);

      const { scene: created, settings } = await service.createScene({ draft });

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(legacyPayload);
      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith({
        levels: [{ _id: 'defaultLevel0000', background: { src: 'maps/crypt.webp' }, foreground: { src: 'fx/fog.webp' } }]
      });
      expect(firstLevel.foreground).toEqual({ src: 'fx/fog.webp' });
      expect(created).toMatchObject({ id: 'crypt', backgroundSrc: 'maps/crypt.webp' });
      expect(settings.foregroundSrc).toBe('fx/fog.webp');
    });

    it('makes no second call when the core moved them to the first level itself', async () => {
      const { scene } = livingLevel({ background: { src: 'maps/crypt.webp' }, foreground: { src: 'fx/fog.webp' } });
      const { create, update, service } = worldCreating(scene);

      const { scene: created } = await service.createScene({ draft });

      expect(create).toHaveBeenCalledTimes(1);
      expect(update).not.toHaveBeenCalled();
      expect(created.backgroundSrc).toBe('maps/crypt.webp');
    });

    it('completes only the image the core left out', async () => {
      const { scene } = livingLevel({ background: { src: 'maps/crypt.webp' }, foreground: { src: null } });
      const { update, service } = worldCreating(scene);

      await service.createScene({ draft });

      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith({ levels: [{ _id: 'defaultLevel0000', foreground: { src: 'fx/fog.webp' } }] });
    });

    it('makes no second call for a scene created without images', async () => {
      const { scene } = livingLevel({ background: { src: null }, foreground: { src: null } });
      const { create, update, service } = worldCreating(scene);

      const { scene: created } = await service.createScene({ draft: { name: 'Crypt', width: 2000 } });

      expect(create).toHaveBeenCalledWith({ name: 'Crypt', width: 2000 });
      expect(update).not.toHaveBeenCalled();
      expect(created.backgroundSrc).toBeNull();
    });

    it('leaves a scene without a level as it was created', async () => {
      const scene = levelledSceneDocument(null, { id: 'crypt' });
      const { create, update, service } = worldCreating(scene);

      const { scene: created } = await service.createScene({ draft });

      expect(create).toHaveBeenCalledTimes(1);
      expect(update).not.toHaveBeenCalled();
      expect(created).toMatchObject({ id: 'crypt', backgroundSrc: null });
    });
  });

  it.each([
    ['on Foundry 13', 13],
    ['while the core version is unknown', undefined]
  ])('takes one call %s, where the scene itself stores them', async (_case, generation) => {
    if (generation !== undefined) {
      setGeneration(generation);
    }
    const scene = sceneDocument({ id: 'crypt', background: { src: 'maps/crypt.webp' } });
    const { create, update, service } = worldCreating(scene);

    const { scene: created } = await service.createScene({ draft });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(legacyPayload);
    expect(update).not.toHaveBeenCalled();
    expect(created.backgroundSrc).toBe('maps/crypt.webp');
  });
});
