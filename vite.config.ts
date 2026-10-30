/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentManifestPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});

/**
 * Vite plugin that generates a content manifest at build/dev time.
 * Scans the lesson and unit JSON directories,
 * produces a virtual module `virtual:content-manifest` exposing the list of
 * content files so the runtime can import them without dynamic glob imports
 * from a public directory (which Vite does not support reliably).
 *
 * This is the technically correct discovery strategy for Vite:
 * the manifest is generated at build time, and the runtime imports each
 * lesson file through the manifest's static import paths.
 */
function contentManifestPlugin() {
  const virtualModuleId = 'virtual:content-manifest';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  return {
    name: 'content-manifest',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id: string) {
      if (id !== resolvedVirtualModuleId) return;
      const { glob } = await import('node:fs/promises');
      const { resolve, dirname } = await import('node:path');
      const { fileURLToPath } = await import('node:url');

      const root = resolve(dirname(fileURLToPath(import.meta.url)), 'src/content');
      const lessonFiles: string[] = [];
      const unitFiles: string[] = [];
      for await (const file of glob('lessons/**/*.json', { cwd: root })) lessonFiles.push(file);
      for await (const file of glob('units/**/*.json', { cwd: root })) unitFiles.push(file);

      const lessonImports = lessonFiles.map(
        (f, i) => `import lesson${i} from '@/content/lessons/${f.replace('lessons/', '')}';`,
      );
      const unitImports = unitFiles.map(
        (f, i) => `import unit${i} from '@/content/units/${f.replace('units/', '')}';`,
      );

      const lessonEntries = lessonFiles.map(
        (f, i) => `{ path: '${f}', data: lesson${i} }`,
      );
      const unitEntries = unitFiles.map(
        (f, i) => `{ path: '${f}', data: unit${i} }`,
      );

      return `
${lessonImports.join('\n')}
${unitImports.join('\n')}

export const lessonFiles = [${lessonEntries.join(',')}];
export const unitFiles = [${unitEntries.join(',')}];
`;
    },
  };
}
