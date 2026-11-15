import { createGetDoorSoundsHandler } from '../GetDoorSoundsHandler';

describe('getDoorSoundsHandler', () => {
  it('lists the registered door sounds with localized labels', async () => {
    const handler = createGetDoorSoundsHandler({
      globals: () => ({
        CONFIG: { Wall: { doorSounds: { jail: { label: 'WALL.DoorSounds.Jail' }, metal: { label: 'WALL.DoorSounds.Metal' } } } },
        game: { i18n: { localize: (key: string) => key.split('.').at(-1) ?? key } }
      })
    });

    await expect(handler({})).resolves.toEqual({
      sounds: [
        { id: 'jail', label: 'Jail' },
        { id: 'metal', label: 'Metal' }
      ]
    });
  });

  it('answers an empty list when the registry cannot be read', async () => {
    await expect(createGetDoorSoundsHandler({ globals: () => ({}) })({})).resolves.toEqual({ sounds: [] });
  });
});
