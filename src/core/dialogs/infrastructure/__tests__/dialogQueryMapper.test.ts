import type { ChoiceQuestionSpec, PromptQuestionSpec, QuestionSpec } from '../../domain';
import { toDialogOutcome, toDialogQuery } from '../dialogQueryMapper';

const confirm: QuestionSpec = {
  kind: 'confirm',
  title: 'The <door>',
  content: 'Do you open <the> door?\n\nLine one\nline & two "q" \'s\'',
  yesLabel: null,
  noLabel: null
};

const textPrompt: PromptQuestionSpec = {
  kind: 'prompt',
  title: 'Name',
  content: 'Name?',
  inputType: 'text',
  inputLabel: 'Your <b>name</b>',
  defaultValue: '" onfocus="x'
};

const numberPrompt: PromptQuestionSpec = {
  kind: 'prompt',
  title: 'Count',
  content: 'How many?',
  inputType: 'number',
  inputLabel: null,
  defaultValue: 3
};

const choice: ChoiceQuestionSpec = {
  kind: 'choice',
  title: 'Path',
  content: 'Which way?',
  choices: ['Left', 'close', 'Right']
};

describe('toDialogQuery', () => {
  // The markup below was run through the core's own cleanHTML (13.351 and 14.368, under jsdom):
  // it survives unchanged apart from `autofocus=""` and quote normalization inside text.
  it('builds a confirm query with escaped content', () => {
    expect(toDialogQuery(confirm)).toEqual({
      type: 'confirm',
      config: {
        window: { title: 'The <door>' },
        content: '<p>Do you open &lt;the&gt; door?</p><p>Line one<br>line &amp; two &quot;q&quot; &#39;s&#39;</p>'
      }
    });
  });

  it('passes custom yes / no labels as button overrides', () => {
    const query = toDialogQuery({ ...confirm, yesLabel: 'Accept', noLabel: 'Refuse' });
    expect(query.config).toMatchObject({ yes: { label: 'Accept' }, no: { label: 'Refuse' } });
  });

  it('builds an input query with an escaped label and default value', () => {
    expect(toDialogQuery(textPrompt)).toEqual({
      type: 'input',
      config: {
        window: { title: 'Name' },
        content:
          '<p>Name?</p><div class="form-group"><label>Your &lt;b&gt;name&lt;/b&gt;</label><div class="form-fields">' +
          '<input type="text" name="answer" value="&quot; onfocus=&quot;x" autofocus></div></div>'
      }
    });
  });

  it('builds a number input that accepts decimals', () => {
    expect(toDialogQuery(numberPrompt).config['content']).toBe(
      '<p>How many?</p><div class="form-group"><div class="form-fields">' +
        '<input type="number" step="any" name="answer" value="3" autofocus></div></div>'
    );
  });

  it('builds a wait query whose buttons carry the module own action ids', () => {
    expect(toDialogQuery(choice)).toEqual({
      type: 'wait',
      config: {
        window: { title: 'Path' },
        content: '<p>Which way?</p>',
        buttons: [
          { action: 'choice-0', label: 'Left' },
          { action: 'choice-1', label: 'close' },
          { action: 'choice-2', label: 'Right' }
        ]
      }
    });
  });

  it('produces JSON-only data', () => {
    const query = toDialogQuery(choice);
    expect(JSON.parse(JSON.stringify(query))).toEqual(query);
  });
});

describe('toDialogOutcome', () => {
  it('reads a closed dialog as dismissed', () => {
    expect(toDialogOutcome(confirm, null)).toEqual({ type: 'dismissed' });
    expect(toDialogOutcome(choice, undefined)).toEqual({ type: 'dismissed' });
  });

  it('reads yes / no', () => {
    expect(toDialogOutcome(confirm, true)).toEqual({ type: 'answered', answer: { kind: 'confirm', confirmed: true } });
    expect(toDialogOutcome(confirm, false)).toEqual({ type: 'answered', answer: { kind: 'confirm', confirmed: false } });
  });

  it('reads the input field and cuts a long text', () => {
    expect(toDialogOutcome(textPrompt, { answer: 'Arwen' })).toEqual({
      type: 'answered',
      answer: { kind: 'prompt', value: 'Arwen' }
    });
    const long = toDialogOutcome(textPrompt, { answer: 'x'.repeat(5000) });
    expect(long.type === 'answered' && long.answer.kind === 'prompt' ? String(long.answer.value).length : 0).toBe(1000);
  });

  it('reads a number field, an empty one as null', () => {
    expect(toDialogOutcome(numberPrompt, { answer: 2.5 })).toEqual({
      type: 'answered',
      answer: { kind: 'prompt', value: 2.5 }
    });
    expect(toDialogOutcome(numberPrompt, { answer: null })).toEqual({
      type: 'answered',
      answer: { kind: 'prompt', value: null }
    });
  });

  it('reads the pressed choice', () => {
    expect(toDialogOutcome(choice, 'choice-2')).toEqual({
      type: 'answered',
      answer: { kind: 'choice', index: 2, label: 'Right' }
    });
  });

  it.each([
    [confirm, 'yes'],
    [textPrompt, 'Arwen'],
    [textPrompt, { other: 'x' }],
    [textPrompt, { answer: 5 }],
    [numberPrompt, { answer: '5' }],
    [choice, 'choice-3'],
    [choice, 'choice-'],
    [choice, 'close'],
    [choice, 1]
  ])('refuses a reply that does not fit the question (%#)', (spec, reply) => {
    expect(toDialogOutcome(spec, reply)).toEqual({ type: 'failed', reason: 'The reply was not a valid answer' });
  });
});
