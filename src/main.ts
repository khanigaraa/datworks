import './styles.css';
import { createMotion } from './motion';
import { createRouter } from './router';
import { aboutPage } from './pages/about';
import { seriesPage } from './pages/series';
import { homePage, notFoundPage } from './pages/simple';
import { workPage } from './pages/work';
import { createLightbox } from './ui/lightbox';
import { createShell } from './ui/shell';

const outlet = document.getElementById('main')!;
const motion = createMotion(document.getElementById('curtain')!);
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
