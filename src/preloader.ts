import { gsap } from 'gsap';
import { Mesh, Program, Renderer, Triangle } from 'ogl';
import type { Photo } from './content';
import { reducedMotion } from './motion';
import { h } from './ui/dom';
import { photoSrc } from './ui/photo';
import { photoTexture } from './ui/photo-canvas';

const STORAGE_KEY = 'datworks:developed';
const FULL_MS = 2800;
const SHORT_MS = 900;

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Negative → positive: an orange-based film negative develops in uneven, organic
// patches (value noise), under a red safelight wash that fades as the print appears.
const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
  }

  void main() {
    vec3 c = texture2D(tMap, vUv).rgb;
    vec3 negative = (1.0 - c) * vec3(1.0, 0.62, 0.42);
    float n = noise(vUv * 3.0 + uTime * 0.08) * 0.65 + noise(vUv * 11.0) * 0.35;
    float developed = smoothstep(n - 0.2, n + 0.2, uProgress * 1.4 - 0.2);
    vec3 col = mix(negative, c, developed);
    col = mix(col, col * vec3(1.0, 0.3, 0.25), (1.0 - uProgress) * 0.45);
    col += (hash(vUv * 900.0 + fract(uTime)) - 0.5) * 0.07;
    float vignette = smoothstep(1.1, 0.35, length(vUv - 0.5) * 1.4);
    gl_FragColor = vec4(col * vignette, 1.0);
  }
`;

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

/** Returns a setter for the developing progress (0–1), or null when WebGL is unavailable. */
function webglPrint(
  host: HTMLElement,
  photo: Photo,
): { set(p: number): void; destroy(): void; ready: Promise<void> } | null {
  let renderer: Renderer;
  try {
    renderer = new Renderer({ dpr: Math.min(devicePixelRatio, 2), alpha: false });
  } catch {
    return null;
  }
  const gl = renderer.gl;
  if (!gl) return null;
  const { texture, ready } = photoTexture(gl, photo, 1280);
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: { tMap: { value: texture }, uProgress: { value: 0 }, uTime: { value: 0 } },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  host.append(gl.canvas);

  const resize = () => renderer.setSize(host.clientWidth, host.clientHeight);
  resize();
  addEventListener('resize', resize);

  const tick = (t: number) => {
    program.uniforms.uTime.value = t;
    renderer.render({ scene: mesh });
  };
  gsap.ticker.add(tick);
  return {
    ready,
    set: (p) => (program.uniforms.uProgress.value = p),
    destroy() {
      gsap.ticker.remove(tick);
      removeEventListener('resize', resize);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
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
  const status = h('span', { class: 'pre-status mono' }, 'Developing 00%');
  const skip = h('button', { type: 'button', class: 'pre-skip mono' }, 'Skip intro');
  const overlay = h(
    'div',
    { class: 'preloader', 'data-state': 'developing' },
    h('div', { class: 'pre-inner' }, print, h('div', { class: 'pre-foot' }, status, skip)),
  );
  document.body.append(overlay);

  const gl = webglPrint(print, photo);
  if (!gl) {
    print.classList.add('pre-print-css');
    if (photo.image)
      print.style.backgroundImage = `url("${photoSrc(photo.id, photo.image.widths[Math.min(1, photo.image.widths.length - 1)], 'webp')}")`;
    print.style.setProperty('--tone', String(photo.tone ?? 0));
  }

  // Progress follows both time and real asset loading (fonts), whichever is slower.
  // "Loaded" = fonts plus the photo being developed.
  let loaded = 0;
  const assets = Promise.all([document.fonts.ready.catch(() => undefined), gl?.ready]);
  void assets.then(() => (loaded = 1));
  const state = { time: 0 };

  return new Promise((resolve) => {
    let finished = false;
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
