import './styles.css';
import { createRouter } from './router';
import { homePage, notFoundPage } from './pages/simple';
import { workPage } from './pages/work';

const outlet = document.getElementById('main')!;

createRouter(outlet, notFoundPage).add('/', homePage).add('/work', workPage).start();
