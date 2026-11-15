import { draftJournalPage, withTextFormat } from '..';

describe('draftJournalPage with page options', () => {
  it('carries how a page is shown and filed, whatever its type', () => {
    const draft = draftJournalPage({
      name: 'Clip',
      type: 'video',
      src: 'clips/intro.webm',
      caption: 'Intro',
      title: { show: false, level: 2 },
      sort: 200000,
      categoryId: 'c1',
      video: { loop: true, timestamp: null }
    });

    expect(draft).toMatchObject({
      type: 'video',
      caption: 'Intro',
      title: { show: false, level: 2 },
      sort: 200000,
      categoryId: 'c1',
      video: { loop: true, timestamp: null }
    });
  });

  it('gives only a text page the markdown source and the format', () => {
    expect(draftJournalPage({ name: 'Notes', markdown: '# Notes' })).toMatchObject({
      type: 'text',
      format: 'markdown',
      markdown: '# Notes'
    });

    const image = draftJournalPage({ name: 'Map', type: 'image', markdown: '# Map', format: 'markdown' });
    expect(image.format).toBeUndefined();
    expect(image.markdown).toBeUndefined();
  });

  it('keeps an explicit html format', () => {
    expect(draftJournalPage({ name: 'Notes', format: 'html', content: '<p>x</p>' })).toMatchObject({
      format: 'html',
      text: '<p>x</p>'
    });
  });
});

describe('withTextFormat', () => {
  it('makes a page with a markdown source a markdown page', () => {
    expect(withTextFormat({ markdown: '# T' })).toEqual({ markdown: '# T', format: 'markdown' });
  });

  it('leaves the options alone without a markdown source or with a format named', () => {
    const options = { caption: 'x' };

    expect(withTextFormat(options)).toBe(options);
    expect(withTextFormat({ markdown: '# T', format: 'html' as const })).toEqual({ markdown: '# T', format: 'html' });
  });
});
