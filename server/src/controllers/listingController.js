import Listing from '../models/Listing.js';
import mongoose from 'mongoose';
import {
  handleValidationError,
  handleDuplicateKeyError,
  handleDatabaseError,
  handleInvalidIdError,
  handleNotFoundError,
  isDatabaseConnectionError,
  isValidationError,
  isDuplicateKeyError,
  createErrorResponse
} from '../utils/errorHandler.js';
import {
  validatePriceRange,
  validateSquareFeetRange,
  validateZipCode,
  validateObjectId,
  validatePagination,
  validateStatus,
  validateSort
} from '../utils/validators.js';

// Create a new listing
export const createListing = async (req, res) => {
  try {
    const listing = await Listing.create(req.body);
    res.status(201).json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json(handleValidationError(error));
    }
    if (isDuplicateKeyError(error)) {
      return res.status(409).json(handleDuplicateKeyError(error));
    }
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error creating listing', error.message, { type: error.name })
    );
  }
};

// Get all listings
export const getAllListings = async (req, res) => {
  try {
    const {
      minPrice,
      maxPrice,
      minSquareFeet,
      maxSquareFeet,
      zipCode,
      status,
      page,
      limit,
      sortBy,
      order
    } = req.query;

    let query = {};

    // Validate price range
    if (minPrice || maxPrice) {
      const priceValidation = validatePriceRange(minPrice, maxPrice);
      if (!priceValidation.isValid) {
        return res.status(400).json(priceValidation.error);
      }
      if (Object.keys(priceValidation.query).length > 0) {
        query.price = priceValidation.query;
      }
    }

    // Validate square footage range
    if (minSquareFeet || maxSquareFeet) {
      const sqftValidation = validateSquareFeetRange(minSquareFeet, maxSquareFeet);
      if (!sqftValidation.isValid) {
        return res.status(400).json(sqftValidation.error);
      }
      if (Object.keys(sqftValidation.query).length > 0) {
        query.squareFeet = sqftValidation.query;
      }
    }

    // Validate ZIP code
    if (zipCode) {
      const zipValidation = validateZipCode(zipCode);
      if (!zipValidation.isValid) {
        return res.status(400).json(zipValidation.error);
      }
      query.zipCode = zipCode;
    }

    // Validate status
    if (status) {
      const statusValidation = validateStatus(status);
      if (!statusValidation.isValid) {
        return res.status(400).json(statusValidation.error);
      }
      query.status = status;
    }

    // Validate pagination
    const paginationValidation = validatePagination(page, limit);
    if (!paginationValidation.isValid) {
      return res.status(400).json(paginationValidation.error);
    }
    const { page: currentPage, limit: pageLimit } = paginationValidation.pagination;

    // Validate sort
    const sortValidation = validateSort(sortBy, order);
    if (!sortValidation.isValid) {
      return res.status(400).json(sortValidation.error);
    }

    // Calculate skip value for pagination
    const skip = (currentPage - 1) * pageLimit;

    // Execute query with pagination and sorting
    const [listings, totalCount] = await Promise.all([
      Listing.find(query).sort(sortValidation.sort).skip(skip).limit(pageLimit),
      Listing.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageLimit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Return results with pagination metadata
    res.json({
      listings,
      pagination: {
        currentPage,
        pageLimit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      message: listings.length === 0 ? 'No listings found matching the specified criteria' : undefined
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error fetching listings', error.message, { type: error.name })
    );
  }
};

// Get single listing by id
export const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json(handleNotFoundError('Listing', id));
    }

    res.json({ listing });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error fetching listing', error.message, { type: error.name })
    );
  }
};

// Update a listing
export const updateListing = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    // Check if listing exists
    const existingListing = await Listing.findById(id);
    if (!existingListing) {
      return res.status(404).json(handleNotFoundError('Listing', id));
    }

    // Validate empty request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json(
        createErrorResponse(
          'Empty request body',
          'Request body must contain at least one field to update'
        )
      );
    }

    // Update listing with validation
    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true, // Return the updated document
        runValidators: true // Run model validators
      }
    );

    res.json({
      message: 'Listing updated successfully',
      listing: updatedListing
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json(handleValidationError(error));
    }
    if (isDuplicateKeyError(error)) {
      return res.status(409).json(handleDuplicateKeyError(error));
    }
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error updating listing', error.message, { type: error.name })
    );
  }
};

// Delete a listing
export const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    // Find and delete listing
    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
      return res.status(404).json(handleNotFoundError('Listing', id));
    }

    res.json({
      message: 'Listing deleted successfully',
      listing: deletedListing
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error deleting listing', error.message, { type: error.name })
    );
  }
};