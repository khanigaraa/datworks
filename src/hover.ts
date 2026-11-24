import { gsap } from 'gsap';
import { Mesh, Plane, Program, Renderer, Texture } from 'ogl';

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;
  uniform vec4 uRect;      // x, y, width, height in CSS pixels
  uniform vec2 uViewport;
  varying vec2 vUv;
  void main() {
    vUv = vec2(uv.x, 1.0 - uv.y); // y is flipped into DOM space below; keep the image upright
    vec2 px = uRect.xy + (position.xy + 0.5) * uRect.zw;
    vec2 clip = px / uViewport * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  }
`;

// Darkroom hover: a soft lens bulge toward the cursor, a hint of colour fringing, and the red
// safelight blooming around the pointer.
const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uHover;
  uniform vec2 uMouse;
  varying vec2 vUv;

  void main() {
    vec2 m = vec2(uMouse.x, 1.0 - uMouse.y);
    vec2 d = vUv - m;
    float r2 = dot(d, d);
    vec2 uv = vUv - d * exp(-r2 * 14.0) * 0.07 * uHover;
    float ca = 0.004 * uHover;
    vec3 c = vec3(
      texture2D(tMap, uv + vec2(ca, 0.0)).r,
      texture2D(tMap, uv).g,
      texture2D(tMap, uv - vec2(ca, 0.0)).b
    );
    float glow = exp(-r2 * 6.0) * uHover;
    c = mix(c, c * vec3(1.25, 0.55, 0.5) + vec3(0.12, 0.0, 0.0), glow * 0.55);
    gl_FragColor = vec4(c, 1.0);
  }
`;

/**
 * Hover effect for photos inside `[data-hover-fx]` containers (Work grid, Home showreel).
 * One shared WebGL canvas, created on the first hover, draws only the hovered photo on top of
 * its own <img> (used directly as the texture). The render loop runs only while a hover is
 * fading in or out. Everywhere else the CSS fallback in styles.css (a red glow) applies.
 */
export function createHoverFx(root: HTMLElement) {
  let gl: {
    renderer: Renderer;
    program: Program;
    mesh: Mesh;
    texture: Texture;
  } | null = null;
  let frame: HTMLElement | null = null;
  let hover = 0;
  let target = 0;
  const mouse = { x: 0, y: 0 };
  const size = { w: 0, h: 0 };
  let running = false;

  function setup() {
    const renderer = new Renderer({ dpr: Math.min(devicePixelRatio, 2), alpha: true });
    const ctx = renderer.gl;
    ctx.canvas.classList.add('hover-canvas');
    ctx.canvas.setAttribute('aria-hidden', 'true');
    document.body.append(ctx.canvas);
    const texture = new Texture(ctx, { generateMipmaps: false });
    const program = new Program(ctx, {
      vertex,
      fragment,
      cullFace: false,
      uniforms: {
        tMap: { value: texture },
        uRect: { value: [0, 0, 0, 0] },
        uViewport: { value: [innerWidth, innerHeight] },
        uHover: { value: 0 },
        uMouse: { value: [0.5, 0.5] },
      },
    });
    const mesh = new Mesh(ctx, { geometry: new Plane(ctx), program });
    document.documentElement.classList.add('hover-gl');
    return { renderer, program, mesh, texture };
  }

  function tick() {
    if (!gl) return;
    hover += (target - hover) * 0.12;
    const { renderer, program, mesh } = gl;
    if (size.w !== innerWidth || size.h !== innerHeight) {
      size.w = innerWidth;
      size.h = innerHeight;
      renderer.setSize(innerWidth, innerHeight); // resizing clears the canvas, so only when needed
    }
    const u = program.uniforms;
    u.uViewport.value = [innerWidth, innerHeight];
    u.uHover.value = hover;
    if (frame && hover > 0.002) {
      const r = frame.getBoundingClientRect();
      u.uRect.value = [r.left, r.top, r.width, r.height];
      u.uMouse.value = [(mouse.x - r.left) / r.width, (mouse.y - r.top) / r.height];
      renderer.render({ scene: mesh });
    } else {
      // Fully faded out: clear the canvas and stop rendering until the next hover.
      renderer.gl.clear(renderer.gl.COLOR_BUFFER_BIT);
      frame?.classList.remove('is-hover-gl');
      frame = null;
      gsap.ticker.remove(tick);
      running = false;
    }
  }

  function start(el: HTMLElement) {
    const img = el.querySelector('img');
    if (!img || !img.complete || !img.naturalWidth) return; // not loaded yet: CSS fallback covers it
    gl ??= setup();
    frame?.classList.remove('is-hover-gl');
    if (frame !== el) hover = 0;
    frame = el;
    frame.classList.add('is-hover-gl');
    gl.texture.image = img;
    target = 1;
    if (!running) {
      running = true;
      gsap.ticker.add(tick);
    }
  }

  const onOver = (e: PointerEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-hover-fx] .photo-frame');
    if (el && el !== frame) start(el);
    else if (el) target = 1;
  };
  const onOut = (e: PointerEvent) => {
    const el = (e.target as Element).closest('[data-hover-fx] .photo-frame');
    const to = (e.relatedTarget as Element | null)?.closest('[data-hover-fx] .photo-frame');
    if (el && el !== to) target = 0;
  };
  const onMove = (e: PointerEvent) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };

  root.addEventListener('pointerover', onOver);
  root.addEventListener('pointerout', onOut);
  addEventListener('pointermove', onMove, { passive: true });

  return {
    /** Drop any hover when the page changes underneath. */
    reset() {
      target = 0;
      hover = 0;
      frame?.classList.remove('is-hover-gl');
      frame = null;
      if (gl) gl.renderer.gl.clear(gl.renderer.gl.COLOR_BUFFER_BIT);
    },
  };
}
