import { parseRequest } from '../../../shared';
import { askUserRequestSchema, questionRequestSchema, toAskUserCommand, toQuestionQuery } from '..';

const base = { userId: 'ann', title: 'The door', content: 'Do you open it?' };

describe('dialog request validation', () => {
  it('maps a confirm question with the default timeout', () => {
    expect(toAskUserCommand(parseRequest(askUserRequestSchema, { ...base, kind: 'confirm' }))).toEqual({
      userId: 'ann',
      timeoutMs: 300_000,
      spec: { kind: 'confirm', title: 'The door', content: 'Do you open it?', yesLabel: null, noLabel: null }
    });
  });

  it('maps custom labels and a timeout', () => {
    const command = toAskUserCommand(
      parseRequest(askUserRequestSchema, { ...base, kind: 'confirm', yesLabel: 'Accept', noLabel: 'Refuse', timeoutSeconds: 45 })
    );
    expect(command.timeoutMs).toBe(45_000);
    expect(command.spec).toMatchObject({ yesLabel: 'Accept', noLabel: 'Refuse' });
  });

  it('maps a prompt with text defaults and a number prompt', () => {
    expect(toAskUserCommand(parseRequest(askUserRequestSchema, { ...base, kind: 'prompt' })).spec).toEqual({
      kind: 'prompt',
      title: 'The door',
      content: 'Do you open it?',
      inputType: 'text',
      inputLabel: null,
      defaultValue: null
    });
    expect(
      toAskUserCommand(
        parseRequest(askUserRequestSchema, { ...base, kind: 'prompt', inputType: 'number', inputLabel: 'Gold', defaultValue: 10 })
      ).spec
    ).toMatchObject({ inputType: 'number', inputLabel: 'Gold', defaultValue: 10 });
  });

  it('maps a choice', () => {
    expect(
      toAskUserCommand(parseRequest(askUserRequestSchema, { ...base, kind: 'choice', choices: ['Fight', 'Flee'] })).spec
    ).toEqual({ kind: 'choice', title: 'The door', content: 'Do you open it?', choices: ['Fight', 'Flee'] });
  });

  it.each([
    [{ ...base, kind: 'quiz' }, 'kind'],
    [{ ...base }, 'kind'],
    [{ ...base, kind: 'confirm', userId: '' }, 'userId'],
    [{ ...base, kind: 'confirm', title: '   ' }, 'title: must not be blank'],
    [{ ...base, kind: 'confirm', title: 'x'.repeat(101) }, 'title'],
    [{ ...base, kind: 'confirm', content: 'x'.repeat(2001) }, 'content'],
    [{ ...base, kind: 'confirm', timeoutSeconds: 5 }, 'timeoutSeconds'],
    [{ ...base, kind: 'confirm', timeoutSeconds: 1801 }, 'timeoutSeconds'],
    [{ ...base, kind: 'confirm', timeoutSeconds: 30.5 }, 'timeoutSeconds'],
    [{ ...base, kind: 'confirm', yesLabel: 'x'.repeat(41) }, 'yesLabel'],
    [{ ...base, kind: 'prompt', inputType: 'date' }, 'inputType'],
    [{ ...base, kind: 'prompt', inputType: 'number', defaultValue: 'ten' }, 'defaultValue'],
    [{ ...base, kind: 'prompt', defaultValue: 10 }, 'defaultValue'],
    [{ ...base, kind: 'choice', choices: ['Only'] }, 'choices'],
    [{ ...base, kind: 'choice', choices: ['A', 'A'] }, 'choices: must be distinct'],
    [{ ...base, kind: 'choice', choices: Array.from({ length: 11 }, (_, i) => String(i)) }, 'choices'],
    [{ ...base, kind: 'choice' }, 'choices']
  ])('rejects %j', (params, message) => {
    expect(() => parseRequest(askUserRequestSchema, params)).toThrow(message);
  });

  it('reads a request id', () => {
    expect(toQuestionQuery(parseRequest(questionRequestSchema, { requestId: 'q1' }))).toEqual({ requestId: 'q1' });
    expect(() => parseRequest(questionRequestSchema, { requestId: '' })).toThrow('requestId');
    expect(() => parseRequest(questionRequestSchema, {})).toThrow('requestId');
  });
});
