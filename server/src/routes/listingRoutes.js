import express from 'express';
import { createListing, getAllListings, getListingById } from '../controllers/listingController.js';

const router = express.Router();

router.post('/listings', createListing);
router.get('/listings', getAllListings);
router.get('/listings/:id', getListingById);

export default router;