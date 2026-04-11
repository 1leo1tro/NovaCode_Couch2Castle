import express from 'express';
import {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  markAsSold,
  deleteListing,
  updateListingTags
} from '../controllers/listingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/listings', getAllListings);
router.get('/listings/:id', getListingById);

// Protected routes (authentication required)
router.post('/listings', protect, createListing);
router.put('/listings/:id', protect, updateListing);
router.patch('/listings/:id', protect, updateListing); // Support both PUT and PATCH
router.patch('/listings/:id/sold', protect, markAsSold);
router.patch('/listings/:id/tags', protect, authorize('admin'), updateListingTags);
router.delete('/listings/:id', protect, deleteListing);

export default router;