import OpenHouse from '../models/OpenHouse.js';
import Listing from '../models/Listing.js';
import {
  handleValidationError,
  handleDatabaseError,
  handleNotFoundError,
  isDatabaseConnectionError,
  isValidationError,
  createErrorResponse,
  handleForbidden
} from '../utils/errorHandler.js';
import { validateObjectId, validatePagination } from '../utils/validators.js';

// Helper function to check if agent owns the listing
const isListingOwner = (listing, agentId) => {
  if (!listing?.createdBy || !agentId) {
    return false;
  }
  return listing.createdBy.toString() === agentId.toString();
};

// Create a new open house
export const createOpenHouse = async (req, res) => {
  try {
    // Add agent information (req.agent is set by protect middleware)
    const openHouseData = {
      ...req.body,
      agentId: req.agent._id
    };

    // Validate that the listing exists and belongs to the agent
    const listing = await Listing.findById(openHouseData.listing);
    if (!listing) {
      return res.status(404).json(handleNotFoundError('Listing', openHouseData.listing));
    }

    if (!isListingOwner(listing, req.agent._id)) {
      return res.status(403).json(
        createErrorResponse(
          'Access denied',
          'You can only create open houses for your own listings'
        )
      );
    }

    const openHouse = await OpenHouse.create(openHouseData);

    // Populate listing and agent information in response
    await openHouse.populate('listing', 'address price');
    await openHouse.populate('agentId', 'name email');

    res.status(201).json({
      message: 'Open house created successfully',
      openHouse
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json(handleValidationError(error));
    }
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error creating open house', error.message, { type: error.name })
    );
  }
};

// Get all open houses for agent's listings
export const getAllOpenHouses = async (req, res) => {
  try {
    const { listingId, page, limit } = req.query;
    const agentId = req.agent._id;

    // Build query
    let query = { agentId };

    // Filter by specific listing if provided
    if (listingId) {
      const idValidation = validateObjectId(listingId);
      if (!idValidation.isValid) {
        return res.status(400).json(idValidation.error);
      }

      // Verify listing belongs to agent
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return res.status(404).json(handleNotFoundError('Listing', listingId));
      }
      if (String(listing.createdBy) !== String(agentId)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view open houses for your own listings'
        });
      }

      query.listing = listingId;
    } else {
      // Get all listings owned by this agent
      const agentListings = await Listing.find({ createdBy: agentId }).select('_id');
      const listingIds = agentListings.map(listing => listing._id);

      if (listingIds.length === 0) {
        return res.json({
          openHouses: [],
          count: 0,
          page: 1,
          totalPages: 0,
          message: 'No listings found for this agent'
        });
      }

      query.listing = { $in: listingIds };
    }

    // Validate pagination
    const paginationValidation = validatePagination(page, limit);
    if (!paginationValidation.isValid) {
      return res.status(400).json(paginationValidation.error);
    }
    const { page: currentPage, limit: pageLimit } = paginationValidation.pagination;

    // Calculate skip
    const skip = (currentPage - 1) * pageLimit;

    // Execute query
    const [openHouses, totalCount] = await Promise.all([
      OpenHouse.find(query)
        .populate('listing', 'address price')
        .populate('agentId', 'name email')
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(pageLimit),
      OpenHouse.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageLimit);

    res.json({
      openHouses,
      count: totalCount,
      page: currentPage,
      totalPages,
      message: openHouses.length === 0 ? 'No open houses found' : undefined
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error fetching open houses', error.message, { type: error.name })
    );
  }
};

// Get single open house by ID
export const getOpenHouseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    const openHouse = await OpenHouse.findById(id)
      .populate('listing', 'address price')
      .populate('agentId', 'name email');

    if (!openHouse) {
      return res.status(404).json(handleNotFoundError('Open House', id));
    }

    // Verify agent owns the listing
    const listing = await Listing.findById(openHouse.listing);
    if (!listing || String(listing.createdBy) !== String(req.agent._id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view open houses for your own listings'
      });
    }

    res.json({ openHouse });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error fetching open house', error.message, { type: error.name })
    );
  }
};

// Update an open house
export const updateOpenHouse = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    // Check if open house exists
    const existingOpenHouse = await OpenHouse.findById(id);
    if (!existingOpenHouse) {
      return res.status(404).json(handleNotFoundError('Open House', id));
    }

    // Verify agent owns the listing
    const listing = await Listing.findById(existingOpenHouse.listing);
    if (!listing || String(listing.createdBy) !== String(req.agent._id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update open houses for your own listings'
      });
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

    // Update open house with validation
    const updatedOpenHouse = await OpenHouse.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true, // Return the updated document
        runValidators: true // Run model validators
      }
    ).populate('listing', 'address price')
     .populate('agentId', 'name email');

    res.json({
      message: 'Open house updated successfully',
      openHouse: updatedOpenHouse
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json(handleValidationError(error));
    }
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error updating open house', error.message, { type: error.name })
    );
  }
};

// Delete an open house
export const deleteOpenHouse = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    // Check if open house exists
    const existingOpenHouse = await OpenHouse.findById(id);
    if (!existingOpenHouse) {
      return res.status(404).json(handleNotFoundError('Open House', id));
    }

    // Verify agent owns the listing
    const listing = await Listing.findById(existingOpenHouse.listing);
    if (!listing || String(listing.createdBy) !== String(req.agent._id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete open houses for your own listings'
      });
    }

    const deletedOpenHouse = await OpenHouse.findByIdAndDelete(id);

    res.json({
      message: 'Open house deleted successfully',
      openHouse: deletedOpenHouse
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error deleting open house', error.message, { type: error.name })
    );
  }
};