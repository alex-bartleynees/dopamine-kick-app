import { injectManifest } from 'workbox-build';
import { resolve, dirname } from 'node:path';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distClient = resolve(__dirname, '../.output/public');
const srcSw = resolve(__dirname, '../src/sw.ts');

async function generateServiceWorker() {
  if (!existsSync(distClient)) {
    console.error('Error: .output/public does not exist. Run build first.');
    process.exit(1);
  }

  // Use esbuild to transpile TypeScript to JavaScript
  console.log('Transpiling service worker...');

  try {
    const result = await build({
      entryPoints: [srcSw],
      format: 'esm',
      target: 'es2020',
      bundle: true,
      minify: true,
      write: false,
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });

    if (result.errors.length > 0) {
      console.error('Failed to transpile service worker:', result.errors);
      process.exit(1);
    }

    const swJsContent = result.outputFiles[0].text;
    const tempSwPath = resolve(distClient, 'sw-src.js');
    writeFileSync(tempSwPath, swJsContent);

    console.log('Generating service worker with workbox...');

    const { count, size, warnings } = await injectManifest({
      swSrc: tempSwPath,
      swDest: resolve(distClient, 'sw.js'),
      globDirectory: distClient,
      globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
      globIgnores: ['sw-src.js', 'sw.js'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      mode: 'production',
    });

    unlinkSync(tempSwPath);

    if (warnings.length > 0) {
      console.warn('Warnings:', warnings.join('\n'));
    }

    console.log(
      `Service worker generated with ${count} files, totaling ${(size / 1024).toFixed(1)} KB`
    );
  } catch (error) {
    console.error('Error generating service worker:', error);
    process.exit(1);
  }
}

generateServiceWorker();
