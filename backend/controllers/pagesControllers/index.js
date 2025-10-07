import createPage from './createPage.controller.js';
import deletePage from './deletePage.controller.js';
import { getPage, getPages, getPageNameAndId } from './getPages.controller.js';
import { publicShare, getPublicShare } from './publicShare.controller.js';
import renamePage from './renamePage.controller.js';
import savePage from './savePage.controller.js';
import sharePage from './sharePage.controller.js';

export {
  createPage,
  savePage,
  renamePage,
  getPage,
  getPages,
  deletePage,
  sharePage,
  publicShare,
  getPublicShare,
};
