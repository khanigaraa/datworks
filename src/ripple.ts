import { gsap } from 'gsap';
import { Mesh, Plane, Program, Renderer, Transform } from 'ogl';
import { catalog } from './content';
import { photoTexture } from './ui/photo-canvas';

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;
  uniform vec4 uRect;      // x, y, width, height in CSS pixels
  uniform vec2 uViewport;  // viewport size in CSS pixels
  varying vec2 vUv;
  void main() {
    // Positions are flipped into DOM space (y down), so flip v too: the image top (v = 1 with flipY)
    // lands on the frame's top edge.
    vUv = vec2(uv.x, 1.0 - uv.y);
    vec2 px = uRect.xy + (position.xy + 0.5) * uRect.zw;
    vec2 clip = px / uViewport * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  }
`;

// Water: a slow swell driven by scroll speed, rings spreading from the cursor on hover,
// and faint caustic highlights, like light on the bottom of a pool.
const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uTime;
  uniform float uStrength;
  uniform float uHover;
  uniform vec2 uMouse;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 m = vec2(uMouse.x, 1.0 - uMouse.y); // DOM mouse is top-left origin; vUv.y is 1 at the top
    float d = distance(uv, m);
    float ring = sin(d * 42.0 - uTime * 6.0) * exp(-d * 5.0) * uHover * 0.014;
    vec2 swell = vec2(sin(uv.y * 16.0 + uTime * 2.4), cos(uv.x * 12.0 + uTime * 1.8)) * uStrength * 0.018;
    uv += swell + normalize(uv - m + 1e-4) * ring;
    vec3 c = texture2D(tMap, clamp(uv, 0.0, 1.0)).rgb;
    float caustic = pow(abs(sin((uv.x + uv.y) * 22.0 + uTime * 1.6 + sin(uv.y * 9.0 + uTime))), 14.0);
    c += caustic * (0.012 + uStrength * 0.05 + uHover * 0.03) * vec3(0.55, 0.85, 1.0);
    gl_FragColor = vec4(c, 1.0);
  }
`;

/**
 * Draws every `[data-photo]` frame inside `root` with a water-ripple shader, using one
 * shared WebGL canvas fixed over the viewport (not one context per photo). The DOM frames
 * stay in place, invisible, so the lightbox buttons and layout keep working.
 * `velocity()` returns the current scroll speed. Returns a cleanup function.
 */
export function createRipple(root: HTMLElement, velocity: () => number): () => void {
  const renderer = new Renderer({ dpr: Math.min(devicePixelRatio, 2), alpha: true });
  const gl = renderer.gl;
  gl.canvas.classList.add('ripple-canvas');
  gl.canvas.setAttribute('aria-hidden', 'true');
  document.body.append(gl.canvas);
  root.classList.add('ripple-active');

  const scene = new Transform();
  const geometry = new Plane(gl);
  const viewport = { value: [innerWidth, innerHeight] };
  const mouse = { x: -1, y: -1 };

  const items = [...root.querySelectorAll<HTMLElement>('.photo-frame')].flatMap((frame) => {
    const id = frame.closest<HTMLElement>('[data-photo]')?.dataset.photo;
    const photo = id && catalog.getPhoto(id);
    if (!photo) return [];
    const { texture } = photoTexture(gl, photo, 1280);
    const program = new Program(gl, {
      vertex,
      fragment,
      // The vertex shader flips y into DOM space, which flips the winding: draw both faces.
      cullFace: false,
      uniforms: {
        tMap: { value: texture },
        uRect: { value: [0, 0, 0, 0] },
        uViewport: viewport,
        uTime: { value: 0 },
        uStrength: { value: 0 },
        uHover: { value: 0 },
        uMouse: { value: [0.5, 0.5] },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);
    return [{ frame, program, mesh, hover: 0 }];
  });

  const resize = () => {
    renderer.setSize(innerWidth, innerHeight);
    viewport.value = [innerWidth, innerHeight];
  };
  const onMove = (e: PointerEvent) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };
  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', onMove, { passive: true });

  let strength = 0;
  const tick = (time: number) => {
    // Ease toward the scroll speed so the water calms down after you stop.
    strength += (Math.min(Math.abs(velocity()) / 1500, 1) - strength) * 0.08;
    for (const item of items) {
      const r = item.frame.getBoundingClientRect();
      const visible = r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
      item.mesh.visible = visible;
      if (!visible) continue;
      const inside = mouse.x >= r.left && mouse.x <= r.right && mouse.y >= r.top && mouse.y <= r.bottom;
      item.hover += ((inside ? 1 : 0) - item.hover) * 0.1;
      const u = item.program.uniforms;
      u.uRect.value = [r.left, r.top, r.width, r.height];
      u.uTime.value = time;
      u.uStrength.value = strength;
      u.uHover.value = item.hover;
      if (inside) u.uMouse.value = [(mouse.x - r.left) / r.width, (mouse.y - r.top) / r.height];
    }
    renderer.render({ scene, sort: false, frustumCull: false });
  };
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    removeEventListener('resize', resize);
    removeEventListener('pointermove', onMove);
    root.classList.remove('ripple-active');
    gl.canvas.remove();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
