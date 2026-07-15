// Domain — value objects
export { Range } from './domain/value-objects/Range';
export { PaginationParams } from './domain/value-objects/PaginationParams';
export { EnumSet } from './domain/value-objects/EnumSet';
export { SubstringQuery } from './domain/value-objects/SubstringQuery';
export { FolderReference } from './domain/value-objects/FolderReference';

// Domain — errors
export { DomainError } from './domain/errors/DomainError';
export { ValidationError } from './domain/errors/ValidationError';

// Domain — specification
export type { ISpecification } from './domain/specification/Specification';
export { CompositeSpecification } from './domain/specification/CompositeSpecification';
export { AndSpecification } from './domain/specification/AndSpecification';
export { OrSpecification } from './domain/specification/OrSpecification';
export { NotSpecification } from './domain/specification/NotSpecification';
export { AlwaysTrueSpecification } from './domain/specification/AlwaysTrueSpecification';
export { AlwaysFalseSpecification } from './domain/specification/AlwaysFalseSpecification';
export { FolderSpecification } from './domain/specification/FolderSpecification';
export type { FolderIdExtractor } from './domain/specification/FolderSpecification';

// Domain — repository
export type { FilterableRepository } from './domain/repository/FilterableRepository';
export type { PaginatedQueryResult } from './domain/repository/PaginatedQueryResult';
export type { FolderResolver } from './domain/repository/FolderResolver';

// Validation
export { formatZodError } from './validation/ZodErrorFormatter';
export { makeRangeSchema } from './validation/RangeSchema';
export type { MakeRangeSchemaOptions, RangeSchemaOutput } from './validation/RangeSchema';
export { paginationSchema } from './validation/PaginationSchema';
export type { PaginationInput } from './validation/PaginationSchema';
export { folderReferenceSchema } from './validation/FolderReferenceSchema';

// Application
export { SpecificationBuilder } from './application/SpecificationBuilder';
export type { SpecificationFactory } from './application/SpecificationBuilder';
export { executeFilterQuery } from './application/FilterQueryService';

// Infrastructure
export { FoundryFolderResolver } from './infrastructure/FoundryFolderResolver';
export type {
  FoundryFolderDocument,
  FoundryFoldersCollection,
  FoundryFolderGameProvider
} from './infrastructure/foundryFolderTypes';
