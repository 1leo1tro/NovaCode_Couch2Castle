import express from 'express';
import {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing
} from '../controllers/listingController.js';

const router = express.Router();

// Listing CRUD operations
router.post('/listings', createListing);
router.get('/listings', getAllListings);
router.get('/listings/:id', getListingById);
router.put('/listings/:id', updateListing);
router.patch('/listings/:id', updateListing); // Support both PUT and PATCH
router.delete('/listings/:id', deleteListing);

export default router;