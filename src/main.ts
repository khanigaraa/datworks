import './styles.css';
import { catalog } from './content';
import { createMotion } from './motion';
import { homePage } from './pages/home';
import { runPreloader } from './preloader';
import { createRouter } from './router';
import { aboutPage } from './pages/about';
import { seriesPage } from './pages/series';
import { notFoundPage } from './pages/simple';
import { workPage } from './pages/work';
import { canHoverFx } from './capability';
import { createLightbox } from './ui/lightbox';
import { createShell } from './ui/shell';

const outlet = document.getElementById('main')!;
// The "developing" intro greets visitors on the landing page; deep links (/work, /series/…)
// go straight to what was asked for.
const intro = location.pathname === '/' ? runPreloader(catalog.showreel()[0]) : Promise.resolve();
const motion = createMotion(document.getElementById('curtain')!, intro);
motion.lockScroll(true);
void intro.then(() => motion.lockScroll(false));
const shell = createShell(document.getElementById('site-header')!, { onToggle: motion.lockScroll });
const lightbox = createLightbox(outlet, { onToggle: motion.lockScroll });
// The WebGL hover is its own chunk, loaded only where it will run (a capable desktop).
let hover: { reset(): void } | null = null;
if (canHoverFx()) void import('./hover').then(({ createHoverFx }) => (hover = createHoverFx(outlet)));

createRouter(outlet, notFoundPage, {
  ...motion.hooks,
  unmount() {
    lightbox.close();
    hover?.reset();
    motion.hooks.unmount();
  },
  enter(el, info) {
    shell.setActive(info.url.pathname);
    motion.hooks.enter(el, info);
  },
})
  .add('/', homePage)
  .add('/work', workPage)
  .add('/series/:slug', seriesPage)
  .add('/about', aboutPage)
  .start();
