import express from 'express';

import {
  createPage,
  savePage,
  renamePage,
  getPage,
  getPages,
  deletePage,
  sharePage,
  publicShare,
  getPublicShare,
} from '../../controllers/pagesControllers/index.js';

const router = express.Router();

router.post('/createpage', async (req, res) => {
  const { resStatus, resMessage } = await createPage(req);
  res.status(resStatus).json(resMessage);
});

router.post('/savepage', async (req, res) => {
  const { resStatus, resMessage } = await savePage(req);
  res.status(resStatus).json(resMessage);
});

router.post('/renamepage', async (req, res) => {
  const { resStatus, resMessage } = await renamePage(req);
  res.status(resStatus).json(resMessage);
});

router.post('/getpage', async (req, res) => {
  const { resStatus, resMessage } = await getPage(req);
  res.status(resStatus).json(resMessage);
});

router.post('/getpages', async (req, res) => {
  const { resStatus, resMessage } = await getPages(req);
  res.status(resStatus).json(resMessage);
});

router.delete('/deletepage', async (req, res) => {
  const { resStatus, resMessage } = await deletePage(req);
  res.status(resStatus).json(resMessage);
});

router.post('/sharepage', async (req, res) => {
  const { resStatus, resMessage } = await sharePage(req);
  res.status(resStatus).json(resMessage);
});

router.post('/publicshare', async (req, res) => {
  const { resStatus, resMessage } = await publicShare(req);
  res.status(resStatus).json(resMessage);
});

router.get('/share/:shareId', async (req, res) => {
  const { shareId } = req.params;
  const { resStatus, resMessage } = await getPublicShare(shareId);
  res.status(resStatus).json(resMessage);
});
export default router;
