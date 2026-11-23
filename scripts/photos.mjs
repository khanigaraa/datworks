// Image pipeline: originals/**/*.jpg  →  public/photos/<id>-<width>.{avif,webp} + src/content/photo-meta.json
//
//   npm run photos            process new or changed photos
//   npm run photos -- --force  re-encode everything
//
// - Photo id = file name slugified ("dara grad-04.jpg" → "dara-grad-04"); content data refers to these ids.
// - Idempotent: a photo is skipped when its source size + mtime match the stored metadata and every
//   output file exists.
// - EXIF orientation is applied, then all metadata (EXIF, GPS, camera info) is stripped.
// - Uses the wasm32 build of sharp: Windows Application Control blocks native .node binaries here.
import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'originals');
const OUT = join(ROOT, 'public', 'photos');
const META = join(ROOT, 'src', 'content', 'photo-meta.json');

const WIDTHS = [640, 1280, 1920];
const AVIF = { quality: 50, effort: 2 }; // effort 4 is ~25% smaller but ~9x slower in wasm
const WEBP = { quality: 74 };
const BLUR_WIDTH = 20;

const force = process.argv.includes('--force');

export const slugify = (name) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return walk(path);
    return /\.jpe?g$/i.test(e.name) ? [path] : [];
  });
}

const outputs = (id, widths) => widths.flatMap((w) => ['avif', 'webp'].map((f) => join(OUT, `${id}-${w}.${f}`)));

async function processPhoto(file, previous) {
  const id = slugify(basename(file, extname(file)));
  const { size, mtimeMs } = statSync(file);
  const source = { size, mtimeMs: Math.round(mtimeMs) };

  if (
    !force &&
    previous &&
    previous.source?.size === source.size &&
    previous.source?.mtimeMs === source.mtimeMs &&
    outputs(id, previous.widths).every((p) => existsSync(p))
  )
    return { id, meta: previous, skipped: true };

  const info = await sharp(file).metadata();
  const rotated = (info.orientation ?? 1) >= 5;
  const width = rotated ? info.height : info.width;
  const height = rotated ? info.width : info.height;
  const widths = WIDTHS.filter((w) => w <= width);
  if (!widths.length) widths.push(width);

  for (const w of widths) {
    const resized = sharp(file).rotate().resize({ width: w });
    await resized.clone().avif(AVIF).toFile(join(OUT, `${id}-${w}.avif`));
    await resized.clone().webp(WEBP).toFile(join(OUT, `${id}-${w}.webp`));
  }
  const tiny = await sharp(file).rotate().resize({ width: BLUR_WIDTH }).webp({ quality: 40 }).toBuffer();

  return {
    id,
    meta: { width, height, widths, blur: `data:image/webp;base64,${tiny.toString('base64')}`, source },
    skipped: false,
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const meta = existsSync(META) ? JSON.parse(readFileSync(META, 'utf8')) : {};
  const files = walk(SRC).sort();
  if (!files.length) {
    console.log(`No photos in ${relative(ROOT, SRC)}/. See .scratch/datworks/foto-download.md.`);
    return;
  }

  const seen = new Set();
  let done = 0;
  for (const file of files) {
    const started = Date.now();
    const { id, meta: m, skipped } = await processPhoto(file, meta[slugify(basename(file, extname(file)))]);
    if (seen.has(id)) throw new Error(`Two originals map to the same id "${id}" (${relative(ROOT, file)})`);
    seen.add(id);
    meta[id] = m;
    done++;
    const label = skipped ? 'skip' : `${((Date.now() - started) / 1000).toFixed(1)}s`;
    console.log(`[${String(done).padStart(3)}/${files.length}] ${id.padEnd(28)} ${label}`);
    // Save as we go, so an interrupted run keeps its progress.
    if (!skipped) writeFileSync(META, JSON.stringify(sortKeys(meta), null, 2) + '\n');
  }
  writeFileSync(META, JSON.stringify(sortKeys(meta), null, 2) + '\n');
  console.log(`Done: ${files.length} photos, metadata in ${relative(ROOT, META)}`);
}

const sortKeys = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

await main();
