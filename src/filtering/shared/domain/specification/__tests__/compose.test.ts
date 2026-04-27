import type { ISpecification } from '../Specification';

type ComposeModule = typeof import('../compose');

const dummySpec: ISpecification<unknown> = {
  isSatisfiedBy: () => true,
  and: () => dummySpec,
  or: () => dummySpec,
  not: () => dummySpec,
};

describe('compose factory registry', () => {
  it('andSpec throws when AndSpecification factory is not registered', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const compose = require('../compose') as ComposeModule;
      expect(() => compose.andSpec(dummySpec, dummySpec)).toThrow(
        'AndSpecification factory has not been registered'
      );
    });
  });

  it('orSpec throws when OrSpecification factory is not registered', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const compose = require('../compose') as ComposeModule;
      expect(() => compose.orSpec(dummySpec, dummySpec)).toThrow(
        'OrSpecification factory has not been registered'
      );
    });
  });

  it('notSpec throws when NotSpecification factory is not registered', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const compose = require('../compose') as ComposeModule;
      expect(() => compose.notSpec(dummySpec)).toThrow(
        'NotSpecification factory has not been registered'
      );
    });
  });

  it('factories work after registration via the registerXFactory functions', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const compose = require('../compose') as ComposeModule;

      const sentinel: ISpecification<unknown> = {
        isSatisfiedBy: () => false,
        and: () => sentinel,
        or: () => sentinel,
        not: () => sentinel,
      };

      compose.registerAndFactory(() => sentinel);
      compose.registerOrFactory(() => sentinel);
      compose.registerNotFactory(() => sentinel);

      expect(compose.andSpec(dummySpec, dummySpec)).toBe(sentinel);
      expect(compose.orSpec(dummySpec, dummySpec)).toBe(sentinel);
      expect(compose.notSpec(dummySpec)).toBe(sentinel);
    });
  });
});
