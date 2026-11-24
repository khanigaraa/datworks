// Image pipeline: curated originals  →  public/photos/<id>-<width>.{avif,webp} + src/content/photo-meta.json
//
//   npm run photos            process new or changed photos
//   npm run photos -- --force  re-encode everything
//
// - scripts/photos.manifest.json is the curation: { "<photo id>": "<path under originals/>" }.
//   Only those photos are processed, so the Drive dumps in originals/ can stay as they are and
//   camera file names (DSC00063.jpg in three folders) never clash. Content data refers to the ids.
// - Photos dropped from the manifest are pruned from the metadata and public/photos.
// - Idempotent: a photo is skipped when its source size + mtime match the stored metadata and every
//   output file exists.
// - EXIF orientation is applied, then all metadata (EXIF, GPS, camera info) is stripped.
// - Uses the wasm32 build of sharp: Windows Application Control blocks native .node binaries here.
import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'originals');
const OUT = join(ROOT, 'public', 'photos');
const META = join(ROOT, 'src', 'content', 'photo-meta.json');
const MANIFEST = join(ROOT, 'scripts', 'photos.manifest.json');

const WIDTHS = [640, 960, 1280, 1920]; // 960 fits phones at DPR ~1.75 without jumping to 1280
const AVIF = { quality: 50, effort: 2 }; // effort 4 is ~25% smaller but ~9x slower in wasm
const WEBP = { quality: 74 };
const BLUR_WIDTH = 20;

const force = process.argv.includes('--force');

/** Renditions for a source of the given width (never upscaled). */
const widthsFor = (width) => {
  const widths = WIDTHS.filter((w) => w <= width);
  return widths.length ? widths : [width];
};
const outputs = (id, widths) => widths.flatMap((w) => ['avif', 'webp'].map((f) => join(OUT, `${id}-${w}.${f}`)));
const sortKeys = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const save = (meta) => writeFileSync(META, JSON.stringify(sortKeys(meta), null, 2) + '\n');

async function processPhoto(id, file, previous) {
  const { size, mtimeMs } = statSync(file);
  const source = { size, mtimeMs: Math.round(mtimeMs) };

  const unchanged = previous && previous.source?.size === source.size && previous.source?.mtimeMs === source.mtimeMs;
  const expected = previous ? widthsFor(previous.width) : [];
  if (!force && unchanged && outputs(id, expected).every((p) => existsSync(p)))
    return { meta: { ...previous, widths: expected }, skipped: true };

  const info = await sharp(file).metadata();
  const rotated = (info.orientation ?? 1) >= 5;
  const width = rotated ? info.height : info.width;
  const height = rotated ? info.width : info.height;
  const widths = widthsFor(width);

  for (const w of widths) {
    const avif = join(OUT, `${id}-${w}.avif`);
    const webp = join(OUT, `${id}-${w}.webp`);
    // Same source and the files are there (e.g. only a new width was added): keep them.
    if (!force && unchanged && existsSync(avif) && existsSync(webp)) continue;
    const resized = sharp(file).rotate().resize({ width: w });
    await resized.clone().avif(AVIF).toFile(avif);
    await resized.clone().webp(WEBP).toFile(webp);
  }
  const tiny = await sharp(file).rotate().resize({ width: BLUR_WIDTH }).webp({ quality: 40 }).toBuffer();

  return {
    meta: { width, height, widths, blur: `data:image/webp;base64,${tiny.toString('base64')}`, source },
    skipped: false,
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const meta = existsSync(META) ? JSON.parse(readFileSync(META, 'utf8')) : {};
  const entries = Object.entries(manifest);

  const missing = entries.filter(([, rel]) => !existsSync(join(SRC, rel)));
  if (missing.length) {
    const list = missing.map(([id, rel]) => `  ${id}: originals/${rel}`).join('\n');
    throw new Error(`${missing.length} curated photo(s) not found:\n${list}\nSee .scratch/datworks/foto-download.md.`);
  }

  let done = 0;
  for (const [id, rel] of entries) {
    const started = Date.now();
    const { meta: m, skipped } = await processPhoto(id, join(SRC, rel), meta[id]);
    meta[id] = m;
    done++;
    const label = skipped ? 'skip' : `${((Date.now() - started) / 1000).toFixed(1)}s`;
    console.log(`[${String(done).padStart(3)}/${entries.length}] ${id.padEnd(28)} ${label}`);
    // Save as we go, so an interrupted run keeps its progress.
    if (!skipped) save(meta);
  }

  // Prune photos that are no longer curated.
  for (const id of Object.keys(meta)) if (!(id in manifest)) delete meta[id];
  for (const f of readdirSync(OUT)) {
    const id = f.replace(/-\d+\.(avif|webp)$/, '');
    if (!(id in manifest)) unlinkSync(join(OUT, f));
  }
  save(meta);
  console.log(`Done: ${entries.length} photos, metadata in ${relative(ROOT, META)}`);
}

await main();
