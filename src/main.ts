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
import { createLightbox } from './ui/lightbox';
import { createShell } from './ui/shell';

const outlet = document.getElementById('main')!;
const intro = runPreloader(catalog.showreel()[0]);
const motion = createMotion(document.getElementById('curtain')!, intro);
motion.lockScroll(true);
void intro.then(() => motion.lockScroll(false));
const shell = createShell(document.getElementById('site-header')!, { onToggle: motion.lockScroll });
const lightbox = createLightbox(outlet, { onToggle: motion.lockScroll });

createRouter(outlet, notFoundPage, {
  ...motion.hooks,
  unmount() {
    lightbox.close();
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
