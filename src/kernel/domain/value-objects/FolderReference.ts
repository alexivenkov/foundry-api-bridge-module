import { ValidationError } from '../errors/ValidationError';

export class FolderReference {
  constructor(
    public readonly id: string | undefined,
    public readonly name: string | undefined,
    public readonly recursive: boolean
  ) {
    if (id === undefined && name === undefined) {
      throw new ValidationError("folder must specify at least 'id' or 'name'");
    }
    if (id !== undefined && id.trim().length === 0) {
      throw new ValidationError("folder 'id' must be non-empty");
    }
    if (name !== undefined && name.trim().length === 0) {
      throw new ValidationError("folder 'name' must be non-empty");
    }
  }
}
