import express from 'express';
import {
  createShowing,
  getAllShowings,
  getPendingShowingsCount,
  getShowingById,
  updateShowingStatus,
  updateFeedback,
  deleteShowing
} from '../controllers/showingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/showings', createShowing);
router.get('/showings/:id', getShowingById);

// Protected routes (authentication required - agent only)
router.get('/showings', protect, getAllShowings);
router.get('/showings/count/pending', protect, getPendingShowingsCount);
router.patch('/showings/:id', protect, updateShowingStatus);
router.patch('/showings/:id/feedback', protect, updateFeedback);
router.delete('/showings/:id', protect, deleteShowing);

export default router;
