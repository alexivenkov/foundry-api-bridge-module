import { NameNeedle } from '../NameNeedle';
import { findSnippet, matchJournalPage, stripHtml } from '../pageTextSearch';
import { journalPageUuid } from '../journalPageAddress';

describe('stripHtml', () => {
  it('flattens tags to spaces and collapses whitespace', () => {
    expect(stripHtml('<h1>Grappling</h1><p>You  can <em>grab</em> a creature.</p>')).toBe(
      'Grappling You can grab a creature.'
    );
  });

  it('decodes the basic entities Foundry emits', () => {
    expect(stripHtml('Attack&nbsp;&amp;&nbsp;Damage &lt;rolls&gt; &quot;crit&quot; &#39;x&#39;')).toBe(
      'Attack & Damage <rolls> "crit" \'x\''
    );
  });

  it('does not double-decode escaped entities (&amp; is decoded last)', () => {
    expect(stripHtml('use &amp;lt; to write a literal')).toBe(
      'use &lt; to write a literal'
    );
  });
});

describe('findSnippet', () => {
  const text = 'a'.repeat(150) + ' The grappled condition restrains you. ' + 'b'.repeat(150);

  it('returns a windowed snippet with ellipses on both truncated sides', () => {
    const snippet = findSnippet(text, 'grappled');
    expect(snippet).toContain('grappled condition');
    expect(snippet?.startsWith('…')).toBe(true);
    expect(snippet?.endsWith('…')).toBe(true);
  });

  it('omits ellipses when the window covers the text edges', () => {
    expect(findSnippet('The grappled condition.', 'grappled')).toBe(
      'The grappled condition.'
    );
  });

  it('matches case-insensitively and returns null when absent', () => {
    expect(findSnippet('GRAPPLED here', 'grappled')).toContain('GRAPPLED');
    expect(findSnippet('nothing relevant', 'grappled')).toBeNull();
  });
});

describe('matchJournalPage', () => {
  const needle = new NameNeedle('grapple');

  it('prefers a name match and carries no snippet', () => {
    const outcome = matchJournalPage(
      new NameNeedle('grappling'),
      { name: 'Grappling', text: '<p>grappling text</p>' },
      true
    );
    expect(outcome).toEqual({ matchedIn: 'name', snippet: null });
  });

  it('falls back to a content match with a snippet', () => {
    const outcome = matchJournalPage(
      needle,
      { name: 'Conditions', text: '<p>The <b>grappled</b> condition…</p>' },
      true
    );
    expect(outcome?.matchedIn).toBe('content');
    expect(outcome?.snippet).toContain('grappled condition');
  });

  it('skips content when searchContent is false or text is null', () => {
    expect(
      matchJournalPage(needle, { name: 'Conditions', text: '<p>grappled</p>' }, false)
    ).toBeNull();
    expect(matchJournalPage(needle, { name: 'Conditions', text: null }, true)).toBeNull();
  });

  it('returns null when nothing matches', () => {
    expect(
      matchJournalPage(needle, { name: 'Falling', text: '<p>You take damage.</p>' }, true)
    ).toBeNull();
  });
});

describe('journalPageUuid', () => {
  it('extends the journal uuid with the embedded page segment', () => {
    expect(journalPageUuid('Compendium.dnd5e.rules.JournalEntry.j1', 'p1')).toBe(
      'Compendium.dnd5e.rules.JournalEntry.j1.JournalEntryPage.p1'
    );
  });
});
