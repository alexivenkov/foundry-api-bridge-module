import { ValidationError } from '../../../../kernel';
import { parseRequest } from '../../../shared';
import {
  getSettingRequestSchema,
  getSettingsRequestSchema,
  setSettingRequestSchema,
  toGetSettingQuery,
  toListSettingsQuery,
  toSetSettingCommand
} from '..';

describe('setting request schemas', () => {
  it('reads absent, null and empty filters as none', () => {
    expect(toListSettingsQuery(parseRequest(getSettingsRequestSchema, {}))).toEqual({ namespace: undefined, scope: undefined });
    expect(toListSettingsQuery(parseRequest(getSettingsRequestSchema, { namespace: null, scope: null }))).toEqual({
      namespace: undefined,
      scope: undefined
    });
    expect(toListSettingsQuery(parseRequest(getSettingsRequestSchema, { namespace: '' }))).toEqual({
      namespace: undefined,
      scope: undefined
    });
  });

  it('maps the filters', () => {
    expect(toListSettingsQuery(parseRequest(getSettingsRequestSchema, { namespace: 'core', scope: 'user' }))).toEqual({
      namespace: 'core',
      scope: 'user'
    });
  });

  it('rejects an unknown scope', () => {
    expect(() => parseRequest(getSettingsRequestSchema, { scope: 'global' })).toThrow(ValidationError);
  });

  it('requires a namespace and a key', () => {
    expect(toGetSettingQuery(parseRequest(getSettingRequestSchema, { namespace: 'core', key: 'fontSize' }))).toEqual({
      namespace: 'core',
      key: 'fontSize'
    });
    expect(() => parseRequest(getSettingRequestSchema, { namespace: 'core' })).toThrow(ValidationError);
    expect(() => parseRequest(getSettingRequestSchema, { namespace: '', key: 'k' })).toThrow(ValidationError);
  });

  it('passes any present value through, null included', () => {
    expect(toSetSettingCommand(parseRequest(setSettingRequestSchema, { namespace: 'm', key: 'k', value: { a: [1] } }))).toEqual({
      namespace: 'm',
      key: 'k',
      value: { a: [1] }
    });
    expect(parseRequest(setSettingRequestSchema, { namespace: 'm', key: 'k', value: null }).value).toBeNull();
  });

  it('requires a value', () => {
    expect(() => parseRequest(setSettingRequestSchema, { namespace: 'm', key: 'k' })).toThrow('is required');
  });
});
