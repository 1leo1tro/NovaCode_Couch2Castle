import express from 'express';
import { getOpenListingsReport, getClosedListingsReport, getOpenListingsDetails } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/reports/open', protect, authorize('manager', 'admin'), getOpenListingsReport);
router.get('/reports/closed', protect, authorize('manager', 'admin'), getClosedListingsReport);
router.get('/reports/open-listings', protect, authorize('manager', 'admin'), getOpenListingsDetails);

export default router;
