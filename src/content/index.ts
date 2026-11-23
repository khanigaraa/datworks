import { createCatalog } from './catalog';
import { contentData } from './data';

export const catalog = createCatalog(contentData);
export { createCatalog } from './catalog';
export * from './types';
