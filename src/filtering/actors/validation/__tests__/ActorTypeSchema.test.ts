import { actorTypeArraySchema } from '../ActorTypeSchema';

describe('actorTypeArraySchema', () => {
  it('accepts a valid array of lowercase actor types', () => {
    const result = actorTypeArraySchema.safeParse(['character', 'npc']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['character', 'npc']);
  });

  it('normalizes uppercase values to lowercase', () => {
    const result = actorTypeArraySchema.safeParse(['CHARACTER']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['character']);
  });

  it('normalizes mixed-case values to lowercase', () => {
    const result = actorTypeArraySchema.safeParse(['Vehicle']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['vehicle']);
  });

  it('trims surrounding whitespace before normalization', () => {
    const result = actorTypeArraySchema.safeParse(['  character  ']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['character']);
  });

  it('accepts all four valid actor types together', () => {
    const result = actorTypeArraySchema.safeParse(['character', 'npc', 'vehicle', 'group']);
    expect(result.success).toBe(true);
  });

  it('rejects an empty array with the configured message', () => {
    const result = actorTypeArraySchema.safeParse([]);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe('type array must not be empty');
  });

  it('rejects an array with an unknown actor type', () => {
    const result = actorTypeArraySchema.safeParse(['unknown']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("unknown actorType: 'unknown'");
  });

  it('rejects a non-array input', () => {
    expect(actorTypeArraySchema.safeParse('character').success).toBe(false);
  });

  it('rejects an array containing a non-string element', () => {
    const result = actorTypeArraySchema.safeParse([123]);
    expect(result.success).toBe(false);
  });

  it('attaches the failing element index to the issue path', () => {
    const result = actorTypeArraySchema.safeParse(['character', 'unknown']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual([1]);
  });
});
