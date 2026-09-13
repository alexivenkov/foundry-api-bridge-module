import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as { version: string };

export default defineConfig({
  define: {
    // Single source of truth for the version the module reports at runtime.
    __MODULE_VERSION__: JSON.stringify(pkg.version)
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'FoundryAPIBridge',
      formats: ['es'],
      fileName: () => 'module.js'
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        preserveModules: false
      }
    },
    target: 'es2022',
    emptyOutDir: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
