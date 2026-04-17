import Listing from '../models/Listing.js';
import Showing from '../models/Showing.js';
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
  createErrorResponse,
  handleForbidden
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

const isListingOwner = (listing, agentId) => {
  if (!listing?.createdBy || !agentId) {
    return false;
  }

  return listing.createdBy.toString() === agentId.toString();
};

const handleListingOwnershipError = (action) =>
  createErrorResponse(
    `You can only ${action} your own listings`,
    'Access denied',
    { type: 'FORBIDDEN' }
  );

// Create a new listing
export const createListing = async (req, res) => {
  try {
    // Add agent information (req.agent is set by protect middleware)
    const listingData = {
      ...req.body,
      createdBy: req.agent._id
    };

    const listing = await Listing.create(listingData);

    // Populate agent information in response
    await listing.populate('createdBy', 'name email phone');

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
      keyword,
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

    // Keyword search (case-insensitive)
    if (keyword) {
      const searchRegex = { $regex: keyword, $options: 'i' };
      query.$or = [
        { address: searchRegex },
        { zipCode: searchRegex },
        { status: searchRegex }
      ];
    }

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

    // Default: show all listings except inactive
    query.status = { $ne: 'inactive' };

    // Validate status filter if provided
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
      Listing.find(query).populate('createdBy', 'name phone').sort(sortValidation.sort).skip(skip).limit(pageLimit),
      Listing.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageLimit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Return results with metadata
    res.json({
      listings,
      count: totalCount,
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

    // Atomically increment viewCount and count showings in parallel
    const [listing, showingCount] = await Promise.all([
      Listing.findByIdAndUpdate(
        id,
        { $inc: { viewCount: 1 } },
        { new: true }
      ).populate('createdBy', 'name phone'),
      Showing.countDocuments({ listing: id })
    ]);

    if (!listing) {
      return res.status(404).json(handleNotFoundError('Listing', id));
    }

    res.json({ listing, showingCount });
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

    // Ensure the requesting agent is the owner
    if (!isListingOwner(existingListing, req.agent._id)) {
      return res.status(403).json(handleListingOwnershipError('update'));
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

    // Add agent information (req.agent is set by protect middleware)
    const updateData = {
      ...req.body,
      updatedBy: req.agent._id
    };

    // Update listing with validation
    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true // Run model validators
      }
    ).populate('createdBy updatedBy', 'name email phone');

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

// Mark a listing as sold
export const markAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const { closingDate, finalSalePrice } = req.body;

    if (closingDate === undefined || finalSalePrice === undefined) {
      return res.status(400).json(
        createErrorResponse(
          'Missing required fields',
          'closingDate and finalSalePrice are required to mark a listing as sold'
        )
      );
    }

    const parsedClosingDate = new Date(closingDate);
    if (Number.isNaN(parsedClosingDate.getTime())) {
      return res.status(400).json(
        createErrorResponse('Invalid field', 'closingDate must be a valid date')
      );
    }

    const parsedFinalSalePrice = Number(finalSalePrice);
    if (!Number.isFinite(parsedFinalSalePrice) || parsedFinalSalePrice < 0) {
      return res.status(400).json(
        createErrorResponse('Invalid field', 'finalSalePrice must be a valid non-negative number')
      );
    }

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

    // Ensure the requesting agent is the owner
    if (!existingListing.createdBy || existingListing.createdBy.toString() !== req.agent._id.toString()) {
      return res.status(403).json(handleForbidden('Not authorized', 'Not authorized to modify this listing'));
    }

    // Check if already sold
    if (existingListing.status === 'sold') {
      return res.status(400).json(
        createErrorResponse('Already sold', 'This listing has already been marked as sold')
      );
    }

    // Set sold fields
    existingListing.status = 'sold';
    existingListing.closingDate = parsedClosingDate;
    existingListing.finalSalePrice = parsedFinalSalePrice;
    existingListing.updatedBy = req.agent._id;

    // Save triggers the pre-save hook to compute daysOnMarket
    await existingListing.save();

    // Populate agent info for response
    await existingListing.populate('createdBy updatedBy', 'name email phone');

    res.json({
      message: 'Listing marked as sold',
      listing: existingListing
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json(handleValidationError(error));
    }
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error marking listing as sold', error.message, { type: error.name })
    );
  }
};

// Set/replace tags on a listing (admin only)
export const updateListingTags = async (req, res) => {
  try {
    const { id } = req.params;

    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json(
        createErrorResponse('Invalid tags', 'tags must be an array of strings')
      );
    }

    if (tags.length > 20) {
      return res.status(400).json(
        createErrorResponse('Too many tags', 'A listing may have at most 20 tags')
      );
    }

    const invalidTag = tags.find(tag => typeof tag !== 'string' || tag.length === 0 || tag.length > 50);
    if (invalidTag !== undefined) {
      return res.status(400).json(
        createErrorResponse('Invalid tag', 'Each tag must be a non-empty string of 50 characters or fewer')
      );
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json(handleNotFoundError('Listing', id));
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      { tags, updatedBy: req.agent._id },
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'name email phone');

    res.json({
      message: 'Listing tags updated successfully',
      listing: updatedListing
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json(handleValidationError(error));
    }
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error updating listing tags', error.message, { type: error.name })
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

    // Check if listing exists
    const existingListing = await Listing.findById(id);
    if (!existingListing) {
      return res.status(404).json(handleNotFoundError('Listing', id));
    }

    // Ensure the requesting agent is the owner
    if (!isListingOwner(existingListing, req.agent._id)) {
      return res.status(403).json(handleListingOwnershipError('delete'));
    }

    const deletedListing = await Listing.findByIdAndDelete(id);

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
