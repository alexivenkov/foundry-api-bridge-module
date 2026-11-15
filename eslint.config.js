import tseslint from 'typescript-eslint';

// Architecture boundaries (see CLAUDE.md: "Game-System Architecture",
// "Compendium Architecture", "Core Architecture"). A flat-config rule replaces
// the same rule of an earlier block, so each block carries the full list for
// the files it matches: the context's own limits plus the layer's.

const GAME_SYSTEMS = ['dnd5e', 'pf2e', 'swade', 'coc7'];

const CONTEXTS = [
  { root: 'src/kernel', foreign: ['@/commands', '@/systems', '@/core', '@/compendiums', '@/filtering'] },
  { root: 'src/core', foreign: ['@/commands', '@/systems', '@/compendiums', '@/filtering'] },
  { root: 'src/compendiums', foreign: ['@/commands', '@/systems', '@/core', '@/filtering'] },
  { root: 'src/filtering', foreign: ['@/commands', '@/systems', '@/core', '@/compendiums'] },
  { root: 'src/systems/shared', foreign: ['@/commands', '@/core', '@/compendiums', '@/filtering'] },
  ...GAME_SYSTEMS.map((system) => ({
    root: `src/systems/${system}`,
    foreign: [
      '@/commands',
      '@/filtering',
      ...GAME_SYSTEMS.filter((other) => other !== system).map((other) => `@/systems/${other}`)
    ]
  }))
];

const LAYERS = [
  { name: 'domain', inner: ['application', 'infrastructure', 'validation'] },
  { name: 'application', inner: ['infrastructure'] }
];

function restrictImports(root, foreign, layer) {
  const patterns = [
    {
      group: foreign.flatMap((specifier) => [specifier, `${specifier}/**`]),
      message: `${root} is a separate context and must not depend on this one.`
    }
  ];
  if (layer !== undefined) {
    patterns.push({
      group: layer.inner.flatMap((inner) => [`**/${inner}`, `**/${inner}/**`]),
      message: `The ${layer.name} layer must not depend on ${layer.inner.join(' / ')}.`
    });
  }
  return {
    files: [layer === undefined ? `${root}/**/*.ts` : `${root}/**/${layer.name}/**/*.ts`],
    rules: { 'no-restricted-imports': ['error', { patterns }] }
  };
}

const architectureBoundaries = CONTEXTS.flatMap(({ root, foreign }) => [
  restrictImports(root, foreign),
  ...LAYERS.map((layer) => restrictImports(root, foreign, layer))
]);

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'original/**', 'vite.config.ts', '**/__tests__/**', '**/*.test.ts']
  },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off'
    }
  },
  ...architectureBoundaries
);
