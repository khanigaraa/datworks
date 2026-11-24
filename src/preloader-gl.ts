import { gsap } from 'gsap';
import { Mesh, Program, Renderer, Triangle } from 'ogl';
import type { Photo } from './content';
import { photoTexture } from './ui/photo-canvas';

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

export interface GlPrint {
  set(p: number): void;
  destroy(): void;
  ready: Promise<void>;
}

/** Returns a setter for the developing progress (0–1), or null when WebGL is unavailable. */
export function webglPrint(
  host: HTMLElement,
  photo: Photo,
): GlPrint | null {
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

