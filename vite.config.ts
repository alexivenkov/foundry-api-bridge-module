import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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
