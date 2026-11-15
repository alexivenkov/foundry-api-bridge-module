import { toPlainBubbleHtml } from '..';

describe('toPlainBubbleHtml', () => {
  it('escapes markup and the enricher syntax so the text shows literally', () => {
    expect(toPlainBubbleHtml('<b>Hi</b> & "you" [[/r 1d20]] @UUID[Actor.x]')).toBe(
      '&lt;b&gt;Hi&lt;/b&gt; &amp; &quot;you&quot; &#91;&#91;/r 1d20&#93;&#93; &#64;UUID&#91;Actor.x&#93;'
    );
  });

  it('leaves plain text alone', () => {
    expect(toPlainBubbleHtml("Halt! Who goes there")).toBe('Halt! Who goes there');
  });
});
