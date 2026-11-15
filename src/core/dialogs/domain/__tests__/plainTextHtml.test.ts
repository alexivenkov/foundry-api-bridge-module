import { escapeHtml, plainTextToHtml } from '..';

describe('escapeHtml', () => {
  it('escapes every character that could open markup or close an attribute', () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')"> & more`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; more'
    );
  });
});

describe('plainTextToHtml', () => {
  it('wraps paragraphs and keeps line breaks', () => {
    expect(plainTextToHtml('The door creaks.\nA cold wind blows.\n\nDo you <enter>?')).toBe(
      '<p>The door creaks.<br>A cold wind blows.</p><p>Do you &lt;enter&gt;?</p>'
    );
  });

  it('treats Windows line endings and whitespace-only lines alike', () => {
    expect(plainTextToHtml('one\r\n  \r\ntwo\r\n\n\n\nthree')).toBe('<p>one</p><p>two</p><p>three</p>');
  });

  it('never lets a script through', () => {
    const html = plainTextToHtml('<script>alert(1)</script>');
    expect(html).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    expect(html).not.toContain('<script');
  });
});
