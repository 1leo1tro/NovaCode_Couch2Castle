import express from 'express';
import {
  createOpenHouse,
  getAllOpenHouses,
  getPublicOpenHousesByListing,
  getOpenHouseById,
  updateOpenHouse,
  deleteOpenHouse
} from '../controllers/openHouseController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public route - fetch open houses for a listing (no auth required)
router.get('/open-houses/public', getPublicOpenHousesByListing);

// Protected routes (authentication required - agent only)
router.post('/open-houses', protect, createOpenHouse);
router.get('/open-houses', protect, getAllOpenHouses);
router.get('/open-houses/:id', protect, getOpenHouseById);
router.put('/open-houses/:id', protect, updateOpenHouse);
router.delete('/open-houses/:id', protect, deleteOpenHouse);

export default router;