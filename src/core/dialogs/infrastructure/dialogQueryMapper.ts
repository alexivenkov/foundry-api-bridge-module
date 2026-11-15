import {
  MAX_TEXT_ANSWER_LENGTH,
  escapeHtml,
  plainTextToHtml,
  type DialogOutcome,
  type PromptQuestionSpec,
  type QuestionAnswer,
  type QuestionSpec
} from '@/core/dialogs/domain';
import type { FoundryDialogQuery } from './foundryDialogTypes';

const ANSWER_FIELD = 'answer';
const CHOICE_ACTION = /^choice-(\d{1,2})$/;

const INVALID_REPLY: DialogOutcome = { type: 'failed', reason: 'The reply was not a valid answer' };

/**
 * The query data for `DialogV2._handleQuery`. The recipient's client passes the
 * content through `cleanHTML` and sets button labels and the title as text;
 * the content here is built from escaped text only. Button actions are the
 * module's own ids, so a label can never name a built-in action.
 */
export function toDialogQuery(spec: QuestionSpec): FoundryDialogQuery {
  const window = { title: spec.title };
  const content = plainTextToHtml(spec.content);
  switch (spec.kind) {
    case 'confirm': {
      const config: Record<string, unknown> = { window, content };
      if (spec.yesLabel !== null) {
        config['yes'] = { label: spec.yesLabel };
      }
      if (spec.noLabel !== null) {
        config['no'] = { label: spec.noLabel };
      }
      return { type: 'confirm', config };
    }
    case 'prompt':
      return { type: 'input', config: { window, content: content + inputField(spec) } };
    case 'choice':
      return {
        type: 'wait',
        config: {
          window,
          content,
          buttons: spec.choices.map((label, index) => ({ action: `choice-${String(index)}`, label }))
        }
      };
  }
}

/**
 * What `confirm` / `input` / `wait` resolved to on the recipient's client:
 * `null` when the dialog was closed. The reply comes from another user's
 * browser, so anything but the expected shape is refused.
 */
export function toDialogOutcome(spec: QuestionSpec, reply: unknown): DialogOutcome {
  if (reply === null || reply === undefined) {
    return { type: 'dismissed' };
  }
  const answer = readAnswer(spec, reply);
  return answer !== null ? { type: 'answered', answer } : INVALID_REPLY;
}

function readAnswer(spec: QuestionSpec, reply: unknown): QuestionAnswer | null {
  switch (spec.kind) {
    case 'confirm':
      return typeof reply === 'boolean' ? { kind: 'confirm', confirmed: reply } : null;
    case 'prompt':
      return readPromptAnswer(spec, reply);
    case 'choice': {
      const index = typeof reply === 'string' ? CHOICE_ACTION.exec(reply)?.[1] : undefined;
      const label = index !== undefined ? spec.choices[Number(index)] : undefined;
      return label !== undefined ? { kind: 'choice', index: Number(index), label } : null;
    }
  }
}

function readPromptAnswer(spec: PromptQuestionSpec, reply: unknown): QuestionAnswer | null {
  if (typeof reply !== 'object' || reply === null || !(ANSWER_FIELD in reply)) {
    return null;
  }
  const value: unknown = (reply as Record<string, unknown>)[ANSWER_FIELD];
  if (spec.inputType === 'number') {
    // An empty number field reads as null (`FormDataExtended`).
    if (value === null || (typeof value === 'number' && Number.isFinite(value))) {
      return { kind: 'prompt', value };
    }
    return null;
  }
  return typeof value === 'string' ? { kind: 'prompt', value: value.slice(0, MAX_TEXT_ANSWER_LENGTH) } : null;
}

function inputField(spec: PromptQuestionSpec): string {
  const label = spec.inputLabel !== null ? `<label>${escapeHtml(spec.inputLabel)}</label>` : '';
  const type = spec.inputType === 'number' ? 'type="number" step="any"' : 'type="text"';
  const value = spec.defaultValue !== null ? ` value="${escapeHtml(String(spec.defaultValue))}"` : '';
  return (
    `<div class="form-group">${label}<div class="form-fields">` +
    `<input ${type} name="${ANSWER_FIELD}"${value} autofocus></div></div>`
  );
}
