import {
  UNKNOWN_MACRO_TYPE,
  createMacroRequestSchema,
  deleteMacroRequestSchema,
  executeMacroRequestSchema,
  getMacroRequestSchema,
  getMacrosRequestSchema,
  toCreateMacroCommand,
  toDeleteMacroCommand,
  toExecuteMacroCommand,
  toGetMacroQuery,
  toListMacrosQuery,
  toUpdateMacroCommand,
  updateMacroRequestSchema
} from '..';

describe('macro request schemas', () => {
  describe('get-macros', () => {
    it('accepts a request without a type', () => {
      expect(getMacrosRequestSchema.parse({})).toEqual({});
    });

    it.each(['chat', 'script', 'dance'])('keeps the type %s as it came', (type) => {
      expect(getMacrosRequestSchema.parse({ type })).toEqual({ type });
    });

    it.each([null, 5, true, ['chat'], {}])('reads the non-string type %p as a type no macro has', (type) => {
      expect(getMacrosRequestSchema.parse({ type })).toEqual({ type: UNKNOWN_MACRO_TYPE });
    });
  });

  describe('create-macro', () => {
    it('needs nothing but a name', () => {
      expect(createMacroRequestSchema.parse({ name: 'Bare' })).toEqual({ name: 'Bare' });
    });

    it('accepts every attribute, a null folder included', () => {
      const request = { name: 'Full', type: 'script', command: 'return 1', scope: 'actors', img: 'i.png', folder: null };

      expect(createMacroRequestSchema.parse(request)).toEqual(request);
    });

    it.each([
      ['no name', {}],
      ['a non-string name', { name: 5 }],
      ['a type the core does not have', { name: 'X', type: 'dance' }],
      ['a scope the core does not have', { name: 'X', scope: 'world' }],
      ['a non-string command', { name: 'X', command: 1 }],
      ['a non-string folder', { name: 'X', folder: 7 }]
    ])('rejects %s', (_case, request) => {
      expect(createMacroRequestSchema.safeParse(request).success).toBe(false);
    });

    it('ignores unknown keys', () => {
      expect(createMacroRequestSchema.parse({ name: 'X', sort: 100, ownership: {} })).toEqual({ name: 'X' });
    });
  });

  describe('update-macro', () => {
    it('accepts an update that changes nothing', () => {
      expect(updateMacroRequestSchema.parse({ macroId: 'm1' })).toEqual({ macroId: 'm1' });
    });

    it('keeps a null folder apart from an absent one', () => {
      expect(updateMacroRequestSchema.parse({ macroId: 'm1', folder: null })).toEqual({ macroId: 'm1', folder: null });
      expect('folder' in updateMacroRequestSchema.parse({ macroId: 'm1' })).toBe(false);
    });

    it('rejects an update without a macro id', () => {
      expect(updateMacroRequestSchema.safeParse({ name: 'X' }).success).toBe(false);
    });

    it('ignores a type or scope the core does not have, as the core itself skipped such an update', () => {
      expect(updateMacroRequestSchema.parse({ macroId: 'm1', type: 'dance', scope: '', name: 'X' })).toEqual({
        macroId: 'm1',
        name: 'X'
      });
    });
  });

  describe('get-macro and delete-macro', () => {
    it('need the macro id', () => {
      expect(getMacroRequestSchema.safeParse({}).success).toBe(false);
      expect(deleteMacroRequestSchema.safeParse({ macroId: 7 }).success).toBe(false);
      expect(getMacroRequestSchema.parse({ macroId: 'm1' })).toEqual({ macroId: 'm1' });
      expect(deleteMacroRequestSchema.parse({ macroId: 'm1' })).toEqual({ macroId: 'm1' });
    });
  });

  describe('execute-macro', () => {
    it('needs only the macro id', () => {
      const request = executeMacroRequestSchema.parse({ macroId: 'm1' });

      expect(request).toEqual({ macroId: 'm1' });
      expect('args' in request).toBe(false);
    });

    it('hands the arguments on as the very object the caller sent', () => {
      const args = { nested: { cover: 2 } };

      expect(executeMacroRequestSchema.parse({ macroId: 'm1', args }).args).toBe(args);
    });

    it.each([[[]], [null], ['x'], [1], [true]])(
      'lets the arguments %p through: they are judged after the macro lookup',
      (args) => {
        const parsed = executeMacroRequestSchema.safeParse({ macroId: 'm1', args });

        expect(parsed.success).toBe(true);
        expect(parsed.data?.args).toBe(args);
      }
    );

    it.each([
      ['no macro id', { args: {} }],
      ['a non-string actor', { macroId: 'm1', actorId: 5 }],
      ['a null token', { macroId: 'm1', tokenId: null }]
    ])('rejects %s', (_case, request) => {
      expect(executeMacroRequestSchema.safeParse(request).success).toBe(false);
    });
  });
});

describe('macro request mappers', () => {
  it('maps the list filter', () => {
    expect(toListMacrosQuery({})).toEqual({ type: undefined });
    expect(toListMacrosQuery({ type: 'script' })).toEqual({ type: 'script' });
  });

  it('maps the id of get and delete', () => {
    expect(toGetMacroQuery({ macroId: 'm1' })).toEqual({ macroId: 'm1' });
    expect(toDeleteMacroCommand({ macroId: 'm1' })).toEqual({ macroId: 'm1' });
  });

  it('turns the wire folder into the folder id of a draft', () => {
    const command = toCreateMacroCommand({
      name: 'Full',
      type: 'chat',
      command: '/r 1d20',
      scope: 'actor',
      img: 'i.png',
      folder: 'f1'
    });

    expect(command).toEqual({
      draft: { name: 'Full', type: 'chat', command: '/r 1d20', scope: 'actor', img: 'i.png', folderId: 'f1' }
    });
  });

  it('leaves what a new macro does not state unset', () => {
    const { draft } = toCreateMacroCommand({ name: 'Bare' });

    expect(draft.name).toBe('Bare');
    expect(draft.type).toBeUndefined();
    expect(draft.command).toBeUndefined();
    expect(draft.folderId).toBeUndefined();
  });

  it('keeps an update partial and a null folder a null folder', () => {
    const command = toUpdateMacroCommand({ macroId: 'm1', folder: null });

    expect(command.macroId).toBe('m1');
    expect(command.changes.folderId).toBeNull();
    expect(command.changes.name).toBeUndefined();
    expect(command.changes.type).toBeUndefined();
  });

  it('carries the arguments of execute-macro unparsed', () => {
    const args = ['not', 'an', 'object'];

    const command = toExecuteMacroCommand({ macroId: 'm1', actorId: 'a1', args });

    expect(command).toEqual({ macroId: 'm1', actorId: 'a1', tokenId: undefined, args });
    expect(command.args).toBe(args);
  });
});
