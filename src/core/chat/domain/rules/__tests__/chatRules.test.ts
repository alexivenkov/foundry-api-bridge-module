import {
  chooseSpeaker,
  hasChanges,
  isWhisper,
  stripHtml,
  toTranscriptRecord,
  type ChatMessage
} from '../..';

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    timestamp: 1700000000000,
    author: { id: 'gm', name: 'Gamemaster' },
    speaker: { alias: 'Narrator', actorId: null, tokenId: null },
    content: '<p>Hello <strong>world</strong></p>',
    flavor: null,
    style: 'ic',
    isRoll: false,
    whisper: [],
    ...overrides
  };
}

describe('stripHtml', () => {
  it('drops tags and trims', () => {
    expect(stripHtml('  <p>Hello <strong>world</strong></p>\n')).toBe('Hello world');
  });

  it('decodes the common entities', () => {
    expect(stripHtml('Fish&nbsp;&amp;&nbsp;chips &lt;hot&gt; &quot;now&quot; it&#039;s')).toBe(
      'Fish & chips <hot> "now" it\'s'
    );
  });

  it('decodes an escaped entity twice, as chat text always has', () => {
    expect(stripHtml('a &amp;lt; b')).toBe('a < b');
  });

  it('leaves entities it does not know', () => {
    expect(stripHtml('caf&eacute; &#39;x&#39;')).toBe('caf&eacute; &#39;x&#39;');
  });

  it('returns an empty string for markup without text', () => {
    expect(stripHtml('<div><img src="a.png"></div>')).toBe('');
  });
});

describe('chooseSpeaker', () => {
  it('leaves the default speaker alone when nothing is asked', () => {
    expect(chooseSpeaker(undefined, null, undefined)).toEqual({});
  });

  it('speaks under the given name', () => {
    expect(chooseSpeaker(undefined, null, 'Bartender')).toEqual({ alias: 'Bartender' });
  });

  it('ignores an empty name when no actor is given', () => {
    expect(chooseSpeaker(undefined, null, '')).toEqual({});
  });

  it('speaks for the actor under the actor name, whatever name was given', () => {
    expect(chooseSpeaker('a1', 'Goblin King', 'Mystery NPC')).toEqual({ actorId: 'a1', alias: 'Goblin King' });
  });

  it('falls back to the given name when the actor does not exist', () => {
    expect(chooseSpeaker('a1', null, 'Mystery NPC')).toEqual({ actorId: 'a1', alias: 'Mystery NPC' });
  });

  it('keeps the default alias for a missing actor without a name', () => {
    const choice = chooseSpeaker('a1', null, undefined);

    expect(choice.actorId).toBe('a1');
    expect(choice.alias).toBeUndefined();
  });

  it('lets an empty name stand in for a missing actor', () => {
    expect(chooseSpeaker('a1', null, '')).toEqual({ actorId: 'a1', alias: '' });
  });

  it('keeps an actor name that is empty', () => {
    expect(chooseSpeaker('a1', '', 'Fallback')).toEqual({ actorId: 'a1', alias: '' });
  });
});

describe('toTranscriptRecord', () => {
  it('describes a message in plain text, in the key order of the export', () => {
    const record = toTranscriptRecord(message({ flavor: 'Greeting', isRoll: true }));

    expect(record).toEqual({
      id: 'm1',
      timestamp: 1700000000000,
      author: { userId: 'gm', name: 'Gamemaster' },
      speaker: 'Narrator',
      content: 'Hello world',
      flavor: 'Greeting',
      isRoll: true
    });
    expect(Object.keys(record)).toEqual(['id', 'timestamp', 'author', 'speaker', 'content', 'flavor', 'isRoll']);
    expect(Object.keys(record.author ?? {})).toEqual(['userId', 'name']);
  });

  it('records a missing author as null', () => {
    expect(toTranscriptRecord(message({ author: null })).author).toBeNull();
  });
});

describe('message helpers', () => {
  it.each([
    [{}, false],
    [{ content: undefined, flavor: undefined }, false],
    [{ content: 'New' }, true],
    [{ flavor: '' }, true],
    [{ content: null }, true]
  ])('hasChanges(%j) → %s', (changes, expected) => {
    expect(hasChanges(changes)).toBe(expected);
  });

  it('a message is a whisper when it names recipients', () => {
    expect(isWhisper(message())).toBe(false);
    expect(isWhisper(message({ whisper: ['p1'] }))).toBe(true);
  });
});
