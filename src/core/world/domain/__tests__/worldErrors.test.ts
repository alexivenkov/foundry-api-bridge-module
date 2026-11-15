import { DomainError } from '../../../../kernel';
import { GameNotAvailableError, NegativeWorldTimeError } from '..';

describe('world errors carry the wire texts', () => {
  it.each([
    [new GameNotAvailableError(), 'Game not available'],
    [new NegativeWorldTimeError(), 'worldTime must be >= 0']
  ])('%s', (error, text) => {
    expect(error.message).toBe(text);
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });
});
