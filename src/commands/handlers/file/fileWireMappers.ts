import type { BrowseFilesResult } from '@/commands/types';
import type { DirectoryListing } from '@/core/files';

export function toWireDirectoryListing(listing: DirectoryListing): BrowseFilesResult {
  return {
    source: listing.source,
    path: listing.path,
    bucket: listing.bucket,
    directories: [...listing.directories],
    files: [...listing.files]
  };
}
