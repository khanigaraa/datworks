import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import type { RouterHooks } from './router';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let activeLenis: Lenis | null = null;

/** Scroll an element into view (respecting its CSS scroll-margin), through Lenis when it's running. */
export function scrollToElement(el: HTMLElement) {
  if (activeLenis) activeLenis.scrollTo(el, { force: true });
  else el.scrollIntoView();
}

/**
 * Motion layer: smooth scroll (Lenis), page transitions (a "safelight" curtain) and
 * scroll reveals. Every animation a page creates lives in one gsap.context that is
 * reverted on unmount, so tweens and ScrollTriggers never leak across pages.
 * Reveals and parallax wait for `ready` (the preloader) so they play where people can see them.
 * With reduced motion: no Lenis, no curtain, no reveals; content is simply there.
 */
export function createMotion(curtain: HTMLElement, ready: Promise<void> = Promise.resolve()) {
  const reduce = reducedMotion();
  let ctx: gsap.Context | null = null;
  let lenis: Lenis | null = null;

  if (!reduce) {
    lenis = new Lenis({ autoRaf: false });
    activeLenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis?.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /** Hide reveal targets right away so nothing flashes before the animation starts. */
  function hideReveals(root: HTMLElement) {
    const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
    if (targets.length) gsap.set(targets, { opacity: 0, y: 36 });
  }

  /** Scroll reveals for `[data-reveal]` and parallax for `[data-speed]` (positive = slower). */
  function play(root: HTMLElement) {
    const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
    if (targets.length)
      ScrollTrigger.batch(targets, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, overwrite: true }),
      });
    for (const el of root.querySelectorAll<HTMLElement>('[data-speed]')) {
      gsap.fromTo(
        el,
        { yPercent: Number(el.dataset.speed) * 10 },
        {
          yPercent: Number(el.dataset.speed) * -10,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    }
    ScrollTrigger.refresh();
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
      const page = gsap.context(() => hideReveals(el), el);
      ctx = page;
      if (transition) {
        gsap.killTweensOf(curtain);
        gsap.to(curtain, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.6, ease: 'power3.inOut', delay: 0.05 });
      }
      // Only play if the page is still on screen when the preloader is done.
      void ready.then(() => ctx === page && page.add(() => play(el)));
    },
    scrollTop() {
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo(0, 0);
    },
  };

  return {
    hooks,
    lockScroll(locked: boolean) {
      document.documentElement.classList.toggle('scroll-locked', locked);
      if (locked) lenis?.stop();
      else lenis?.start();
    },
  };
}

export type Motion = ReturnType<typeof createMotion>;
