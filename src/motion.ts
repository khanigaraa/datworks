import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import type { RouterHooks } from './router';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Motion layer: smooth scroll (Lenis), page transitions (a "safelight" curtain) and
 * scroll reveals. Every animation a page creates lives in one gsap.context that is
 * reverted on unmount, so tweens and ScrollTriggers never leak across pages.
 * With reduced motion: no Lenis, no curtain, no reveals; content is simply there.
 */
export function createMotion(curtain: HTMLElement) {
  const reduce = reducedMotion();
  let ctx: gsap.Context | null = null;
  let lenis: Lenis | null = null;

  if (!reduce) {
    lenis = new Lenis({ autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis?.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function reveals(root: HTMLElement) {
    const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!targets.length) return;
    gsap.set(targets, { opacity: 0, y: 36 });
    ScrollTrigger.batch(targets, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, overwrite: true }),
    });
  }

  const hooks: Required<RouterHooks> = {
    leave() {
      if (reduce) return Promise.resolve();
      gsap.killTweensOf(curtain);
      return new Promise((resolve) => {
        gsap.fromTo(
          curtain,
          { scaleY: 0, transformOrigin: '50% 100%' },
          { scaleY: 1, duration: 0.5, ease: 'power3.inOut', onComplete: () => resolve() },
        );
      });
    },
    unmount() {
      ctx?.revert();
      ctx = null;
    },
    enter(el, { transition }) {
      if (reduce) return;
      ctx = gsap.context(() => reveals(el), el);
      if (transition) {
        gsap.killTweensOf(curtain);
        gsap.to(curtain, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.6, ease: 'power3.inOut', delay: 0.05 });
      }
      ScrollTrigger.refresh();
    },
    scrollTop() {
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo(0, 0);
    },
  };

  return {
    hooks,
    /** Run page-specific animations inside the current page's context so they get cleaned up. */
    within(fn: () => void) {
      if (ctx) ctx.add(fn);
    },
    lockScroll(locked: boolean) {
      document.documentElement.classList.toggle('scroll-locked', locked);
      if (locked) lenis?.stop();
      else lenis?.start();
    },
  };
}

export type Motion = ReturnType<typeof createMotion>;
