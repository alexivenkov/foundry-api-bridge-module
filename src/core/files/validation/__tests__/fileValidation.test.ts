import { parseRequest } from '../../../shared';
import { FileTypeNotAllowedError, InvalidStoragePathError } from '../../domain';
import {
  browseFilesRequestSchema,
  createDirectoryRequestSchema,
  toBrowseFilesQuery,
  toCreateDirectoryCommand,
  toUploadFileCommand,
  uploadFileRequestSchema
} from '..';

describe('file request validation', () => {
  describe('browse-files', () => {
    it('defaults to the data root', () => {
      const query = toBrowseFilesQuery(parseRequest(browseFilesRequestSchema, {}));
      expect(query.source).toBe('data');
      expect(query.path.isRoot).toBe(true);
      expect(query).toMatchObject({ bucket: null, extensions: [], wildcard: false });
    });

    it('normalizes extensions and reads a null or empty bucket as absent', () => {
      const query = toBrowseFilesQuery(
        parseRequest(browseFilesRequestSchema, {
          source: 's3',
          path: null,
          bucket: '',
          extensions: ['PNG', '.webp', 'png'],
          wildcard: true
        })
      );
      expect(query).toMatchObject({ source: 's3', bucket: null, extensions: ['.png', '.webp'], wildcard: true });
    });

    it.each([
      [{ source: 'local' }, 'source'],
      [{ extensions: ['p*g'] }, 'extensions.0'],
      [{ extensions: 'png' }, 'extensions'],
      [{ wildcard: 'yes' }, 'wildcard'],
      [{ path: 3 }, 'path']
    ])('rejects %j', (params, field) => {
      expect(() => parseRequest(browseFilesRequestSchema, params)).toThrow(field);
    });

    it('rejects a traversal path', () => {
      expect(() => toBrowseFilesQuery(parseRequest(browseFilesRequestSchema, { path: 'worlds/../..' }))).toThrow(
        InvalidStoragePathError
      );
    });
  });

  describe('create-directory', () => {
    it('parses the path', () => {
      const command = toCreateDirectoryCommand(parseRequest(createDirectoryRequestSchema, { path: 'worlds/w/My%20Maps' }));
      expect(command.path.toString()).toBe('worlds/w/My Maps');
    });

    it('requires a non-empty path', () => {
      expect(() => parseRequest(createDirectoryRequestSchema, {})).toThrow('path');
      expect(() => parseRequest(createDirectoryRequestSchema, { path: '' })).toThrow('path');
    });
  });

  describe('upload-file', () => {
    const params = { directory: 'worlds/w/maps', fileName: 'Cave.PNG', content: 'aGVsbG8=' };

    it('builds the upload command', () => {
      const command = toUploadFileCommand(parseRequest(uploadFileRequestSchema, params));
      expect(command.directory.toString()).toBe('worlds/w/maps');
      expect(command.file).toEqual({
        name: 'Cave.PNG',
        mediaType: { kind: 'image', mimeType: 'image/png' },
        base64: 'aGVsbG8=',
        byteLength: 5
      });
      expect(command.overwrite).toBe(false);
      expect(toUploadFileCommand(parseRequest(uploadFileRequestSchema, { ...params, overwrite: true })).overwrite).toBe(true);
    });

    it('applies the file rules', () => {
      expect(() => toUploadFileCommand(parseRequest(uploadFileRequestSchema, { ...params, fileName: 'x.svg' }))).toThrow(
        FileTypeNotAllowedError
      );
      expect(() =>
        toUploadFileCommand(parseRequest(uploadFileRequestSchema, { ...params, directory: 'worlds/w/../x' }))
      ).toThrow("Invalid directory 'worlds/w/../x'");
    });

    it('rejects missing or mistyped fields', () => {
      expect(() => parseRequest(uploadFileRequestSchema, { ...params, content: '' })).toThrow('content');
      expect(() => parseRequest(uploadFileRequestSchema, { ...params, overwrite: 'yes' })).toThrow('overwrite');
      expect(() => parseRequest(uploadFileRequestSchema, { directory: 'worlds/w' })).toThrow('fileName');
    });

    it('rejects invalid base64 content', () => {
      expect(() => toUploadFileCommand(parseRequest(uploadFileRequestSchema, { ...params, content: 'not base64!' }))).toThrow(
        'Invalid content: not valid base64'
      );
    });
  });
});
