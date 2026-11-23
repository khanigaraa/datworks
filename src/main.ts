import './styles.css';
import { createMotion } from './motion';
import { createRouter } from './router';
import { aboutPage } from './pages/about';
import { homePage, notFoundPage, seriesPage } from './pages/simple';
import { workPage } from './pages/work';
import { createShell } from './ui/shell';

const outlet = document.getElementById('main')!;
const motion = createMotion(document.getElementById('curtain')!);
const shell = createShell(document.getElementById('site-header')!, { onToggle: motion.lockScroll });

createRouter(outlet, notFoundPage, {
  ...motion.hooks,
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
