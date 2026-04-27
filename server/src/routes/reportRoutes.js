import express from 'express';
import {
  getOpenListingsReport,
  getClosedListingsReport,
  getOverviewReport,
  getAgentsReport,
  getAllShowingsReport,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/reports/overview', protect, authorize('manager'), getOverviewReport);
router.get('/reports/open',     protect, authorize('manager'), getOpenListingsReport);
router.get('/reports/closed',   protect, authorize('manager'), getClosedListingsReport);
router.get('/reports/agents',   protect, authorize('manager'), getAgentsReport);
router.get('/reports/showings', protect, authorize('manager'), getAllShowingsReport);

export default router;
