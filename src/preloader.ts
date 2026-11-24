import { gsap } from 'gsap';
import type { Photo } from './content';
import { finePointer } from './capability';
import { reducedMotion } from './motion-pref';
import type { GlPrint } from './preloader-gl';
import { h } from './ui/dom';
import { INTRO_SIZES, photoSrc, photoSrcset } from './ui/photo';

const STORAGE_KEY = 'datworks:developed';
const FULL_MS = 2200;
const SHORT_MS = 900;

function readSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* private mode or blocked storage: just play the full intro next time */
  }
}

/**
 * The "developing" intro: the first showreel frame develops from negative to positive
 * while fonts load. Full length on the first visit, short afterwards, skipped entirely
 * with reduced motion. Without WebGL a CSS filter does the same job.
 * Resolves as soon as the overlay starts lifting.
 */
export function runPreloader(photo: Photo | undefined): Promise<void> {
  if (!photo || reducedMotion()) return Promise.resolve();

  const duration = readSeen() ? SHORT_MS : FULL_MS;
  markSeen();

  const print = h('div', { class: 'pre-print', style: `aspect-ratio:${photo.width}/${photo.height}` });
  // The photo itself, as a real <img> under the WebGL canvas: the content is on screen from the
  // first frames (and is what the browser counts as the largest paint), and it is also what the
  // no-WebGL fallback develops with a CSS filter.
  if (photo.image) {
    const w = photo.image.widths[Math.min(1, photo.image.widths.length - 1)];
    print.append(
      h('img', {
        class: 'pre-photo',
        src: photoSrc(photo.id, w, 'webp'),
        srcset: photoSrcset(photo, 'webp'),
        sizes: INTRO_SIZES,
        alt: '',
        width: photo.width,
        height: photo.height,
        fetchpriority: 'high',
      }),
    );
  }
  const status = h('span', { class: 'pre-status mono' }, 'Developing 00%');
  const skip = h('button', { type: 'button', class: 'pre-skip mono' }, 'Skip intro');
  const overlay = h(
    'div',
    { class: 'preloader', 'data-state': 'developing' },
    h('div', { class: 'pre-inner' }, print, h('div', { class: 'pre-foot' }, status, skip)),
  );
  document.body.append(overlay);

  // Desktops develop the print with a shader (its own chunk, so phones never download it);
  // phones, touch screens and browsers without WebGL use the light CSS version.
  let gl: GlPrint | null = null;
  const useCss = () => print.classList.add('pre-print-css');
  let glReady: Promise<void> = Promise.resolve();
  if (matchMedia('(min-width: 768px)').matches && finePointer()) {
    print.classList.add('pre-print-wait'); // keep the positive photo hidden until the shader runs
    glReady = import('./preloader-gl')
      .then(({ webglPrint }) => {
        gl = finished ? null : webglPrint(print, photo);
        if (!gl) useCss();
        return gl?.ready;
      })
      .catch(useCss)
      .finally(() => print.classList.remove('pre-print-wait'));
  } else useCss();

  // Progress follows both time and real asset loading (fonts), whichever is slower.
  // "Loaded" = fonts plus the photo being developed.
  let loaded = 0;
  let finished = false;
  const assets = Promise.all([document.fonts.ready.catch(() => undefined), glReady]);
  void assets.then(() => (loaded = 1));
  const state = { time: 0 };

  return new Promise((resolve) => {
    const finish = () => {
      if (finished) return;
      finished = true;
      timeline.kill();
      gl?.set(1);
      overlay.dataset.state = 'done';
      print.style.setProperty('--developed', '1');
      gsap.to(overlay, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.8,
        ease: 'power3.inOut',
        delay: 0.15,
        onComplete: () => {
          gl?.destroy();
          overlay.remove();
        },
      });
      // Hand the page back as soon as the overlay starts lifting: the uncovered part is already
      // clickable, so scrolling must work there too (and reveals play while it lifts).
      resolve();
    };

    const timeline = gsap.to(state, {
      time: 1,
      duration: duration / 1000,
      ease: 'power1.inOut',
      onUpdate() {
        const p = Math.min(state.time, loaded ? 1 : 0.9);
        gl?.set(p);
        print.style.setProperty('--developed', p.toFixed(3));
        status.textContent = `Developing ${String(Math.round(p * 100)).padStart(2, '0')}%`;
      },
      onComplete() {
        if (loaded) finish();
        else void assets.finally(finish);
      },
    });

    skip.addEventListener('click', finish);
    overlay.addEventListener('click', finish);
    addEventListener('keydown', (e) => e.key === 'Escape' && finish(), { once: true });
  });
}
