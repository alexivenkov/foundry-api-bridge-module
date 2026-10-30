import { escapeHtml, gmUserIds, postCoc7Card, settingFlag, settingValue, speakerFor, stripHtml } from '../chat';
import { installFakeChatMessage, makeActor, makeFakeRoll, makeGame, uninstallFakeChatMessage } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

describe('coc7 chat helpers', () => {
  afterEach(() => {
    uninstallFakeChatMessage();
  });

  it('strips enriched HTML to text', () => {
    expect(stripHtml('Nyctophobia:<p>Fear of the <b>dark</b>.</p><br>Second&nbsp;line &amp; more')).toBe(
      'Nyctophobia:Fear of the dark.\nSecond line & more'
    );
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });

  it('posts the module card with the rolls attached, the speaker and the lines escaped', async () => {
    const chat = installFakeChatMessage();
    const actor = makeActor();
    const roll = makeFakeRoll('1d10', [4], 4);
    const id = await postCoc7Card(makeGame(), { actor, token: undefined, title: 'Spot Hidden check', lines: ['Total 40', 'a < b'], rolls: [roll], blind: false });
    expect(id).toBe('card-1');
    expect(chat.getSpeaker).toHaveBeenCalledWith({ actor });
    const data = chat.create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(data['rolls']).toEqual([roll]);
    expect(data['speaker']).toEqual({ alias: 'Speaker' });
    expect(data['content']).toContain('<h3>Spot Hidden check</h3>');
    expect(data['content']).toContain('a &lt; b');
    expect(data['whisper']).toBeUndefined();
  });

  it('whispers a blind card to the GMs', async () => {
    const chat = installFakeChatMessage();
    const actor = makeActor();
    const token = { id: 't1', name: 'Harvey', actor };
    await postCoc7Card(makeGame(), { actor, token, title: 'x', lines: [], rolls: [], blind: true });
    expect(chat.getSpeaker).toHaveBeenCalledWith({ actor, token });
    const data = chat.create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(data['whisper']).toEqual(['gm1']);
    expect(data['blind']).toBe(true);
  });

  it('returns undefined without a ChatMessage global and lists GMs from game.users as a fallback', async () => {
    const game = makeGame();
    expect(await postCoc7Card(game, { actor: makeActor(), token: undefined, title: 'x', lines: [], rolls: [], blind: false })).toBeUndefined();
    expect(speakerFor(makeActor(), undefined)).toBeUndefined();
    expect(gmUserIds(game)).toEqual(['gm1']);
  });

  it('reads settings defensively', () => {
    const game = makeGame({ settings: { xpEnabled: true, defaultCheckDifficulty: 'hard' } });
    expect(settingFlag(game, 'xpEnabled')).toBe(true);
    expect(settingFlag(game, 'missing')).toBe(false);
    expect(settingValue(game, 'defaultCheckDifficulty')).toBe('hard');
    const throwing = { ...game, settings: { get: (): unknown => { throw new Error('unregistered'); } } };
    expect(settingFlag(throwing, 'xpEnabled')).toBe(false);
    expect(settingValue(throwing, 'xpEnabled')).toBeUndefined();
  });
});
