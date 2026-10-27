import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

const original = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const output = new URL('../public/icons/', import.meta.url);
await mkdir(output, { recursive: true });
for (const [name, size, maskable] of [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['apple-touch-icon.png', 180, false],
  ['maskable-512.png', 512, true],
]) {
  const svg = maskable
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#dcecdf"/><g transform="translate(64 64) scale(.75)">${original.replace(/<svg[^>]*>|<\/svg>/g, '')}</g></svg>`
    : original;
  await writeFile(
    new URL(name, output),
    new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng(),
  );
}
console.log('Generated 192px, 512px, maskable and Apple touch icons.');
