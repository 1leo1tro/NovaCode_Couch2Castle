import express from 'express';
import { getAllListings, getListingById } from '../controllers/listingController.js';

const router = express.Router();

router.get('/listings', getAllListings);
router.get('/listings/:id', getListingById);

export default router;