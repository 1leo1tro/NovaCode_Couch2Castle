import express from 'express';
import { getOpenListingsReport, getClosedListingsReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/reports/open', protect, authorize('manager'), getOpenListingsReport);
router.get('/reports/closed', protect, authorize('manager'), getClosedListingsReport);

export default router;
