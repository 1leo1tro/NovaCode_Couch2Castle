import express from 'express';
import { getOpenListingsReport, getClosedListingsReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/reports/open', protect, getOpenListingsReport);
router.get('/reports/closed', protect, getClosedListingsReport);

export default router;
