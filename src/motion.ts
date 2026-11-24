import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { webglCapable } from './capability';
import { reducedMotion } from './motion-pref';
import type { RouterHooks } from './router';
import { onTeardown } from './ui/dom';
import { skewToBlur, velocityToSkew } from './ui/velocity';

gsap.registerPlugin(ScrollTrigger);

export { reducedMotion };

let activeLenis: Lenis | null = null;

/** Scroll an element into view (respecting its CSS scroll-margin), through Lenis when it's running. */
export function scrollToElement(el: HTMLElement) {
  if (activeLenis) activeLenis.scrollTo(el, { force: true });
  else el.scrollIntoView();
}

/**
 * Motion layer: smooth scroll (Lenis), page transitions (a "safelight" curtain) and
 * scroll reveals. Every GSAP animation a page creates lives in one gsap.context that is
 * reverted on unmount, so tweens and ScrollTriggers never leak across pages.
 * Reveals are CSS transitions toggled by one IntersectionObserver per page: far cheaper than a
 * ScrollTrigger per element (which cost ~1 s of layout on a throttled phone).
 * Reveals and parallax wait for `ready` (the preloader) so they play where people can see them.
 * With reduced motion: no Lenis, no curtain, no reveals; content is simply there.
 */
export function createMotion(curtain: HTMLElement, ready: Promise<void> = Promise.resolve()) {
  const reduce = reducedMotion();
  let ctx: gsap.Context | null = null;
  let lenis: Lenis | null = null;

  let revealObserver: IntersectionObserver | null = null;

  if (!reduce) {
    // `.motion` hides [data-reveal] until revealed (see styles.css); never set with reduced motion.
    document.documentElement.classList.add('motion');
  }
  // Smooth scroll is for mouse wheels. On touch screens Lenis wouldn't smooth anything anyway,
  // and its per-frame loop would keep the main thread (and battery) busy for nothing.
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    lenis = new Lenis({ autoRaf: false });
    activeLenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis?.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /** Reveal `[data-reveal]` elements as they scroll in; those arriving together are staggered. */
  function observeReveals(root: HTMLElement) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        let i = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.style.setProperty('--reveal-delay', `${Math.min(i++, 8) * 60}ms`);
          el.classList.add('is-in');
          revealObserver?.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    root.querySelectorAll('[data-reveal]').forEach((el) => revealObserver!.observe(el));
  }

  /** Scroll reveals, parallax for `[data-speed]` (positive = slower) and per-layout effects. */
  function play(root: HTMLElement) {
    observeReveals(root);
    // Parallax is a desktop nicety; on phones it costs more main-thread time than it gives.
    const parallax = matchMedia('(min-width: 900px) and (hover: hover)').matches;
    for (const el of parallax ? root.querySelectorAll<HTMLElement>('[data-speed]') : []) {
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
    for (const section of root.querySelectorAll<HTMLElement>('[data-horizontal]')) pinHorizontal(section);
    for (const el of root.querySelectorAll<HTMLElement>('[data-velocity-fx]')) velocityFx(el);
    ScrollTrigger.refresh();
  }

  /**
   * Motion blur: scroll speed sets `--skew` / `--blur` on the element (CSS applies them),
   * then they ease back to zero so photos snap sharp again when you stop.
   */
  function velocityFx(el: HTMLElement) {
    const fx = { skew: 0 };
    const apply = () => {
      el.style.setProperty('--skew', fx.skew.toFixed(2));
      el.style.setProperty('--blur', skewToBlur(fx.skew).toFixed(2));
    };
    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate(self) {
        const skew = velocityToSkew(self.getVelocity());
        if (Math.abs(skew) <= Math.abs(fx.skew)) return;
        fx.skew = skew;
        apply();
        gsap.to(fx, { skew: 0, duration: 0.8, ease: 'power3.out', overwrite: true, onUpdate: apply });
      },
    });
  }

  /** Desktop only: pin the strip and let vertical scroll move it sideways (+ water ripple). */
  function pinHorizontal(section: HTMLElement) {
    if (!matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches) return;
    const track = section.querySelector<HTMLElement>('.h-track');
    if (!track) return;
    section.classList.add('is-pinned');
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: `top ${header}px`,
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });
    // The WebGL water lives in its own chunk, fetched only on capable desktops.
    if (webglCapable())
      void import('./ripple').then(({ createRipple }) => {
        if (!section.isConnected) return; // the page changed while the chunk was loading
        onTeardown(section, createRipple(section, () => tween.scrollTrigger?.getVelocity() ?? 0));
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
      revealObserver?.disconnect();
      revealObserver = null;
      ctx?.revert();
      ctx = null;
    },
    enter(el, { transition }) {
      if (reduce) return;
      const page = gsap.context(() => undefined, el);
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
