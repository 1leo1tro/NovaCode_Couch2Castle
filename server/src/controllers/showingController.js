import Showing from '../models/Showing.js';
import Listing from '../models/Listing.js';
import {
  handleValidationError,
  handleDatabaseError,
  handleNotFoundError,
  handleInvalidIdError,
  isDatabaseConnectionError,
  isValidationError,
  createErrorResponse
} from '../utils/errorHandler.js';
import { validateObjectId, validatePagination } from '../utils/validators.js';

// Create a new showing request (PUBLIC - no auth required)
export const createShowing = async (req, res) => {
  try {
    const { listing, name, email, phone, preferredDate, message } = req.body;

    // Validate listing ID format
    const idValidation = validateObjectId(listing);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    // Verify listing exists
    const listingExists = await Listing.findById(listing);
    if (!listingExists) {
      return res.status(404).json(handleNotFoundError('Listing', listing));
    }

    // Create showing request
    const showing = await Showing.create({
      listing,
      name,
      email,
      phone,
      preferredDate,
      message: message || ''
    });

    // Populate listing and agent information for response
    await showing.populate({
      path: 'listing',
      select: 'address zipCode price createdBy',
      populate: {
        path: 'createdBy',
        select: 'name email phone'
      }
    });

    res.status(201).json({
      message: 'Showing request submitted successfully',
      showing
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json(handleValidationError(error));
    }
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error creating showing request', error.message, { type: error.name })
    );
  }
};

// Get all showing requests for agent's listings (PROTECTED - agent only)
export const getAllShowings = async (req, res) => {
  try {
    const { listingId, status, page, limit } = req.query;
    const agentId = req.agent._id;

    // Build query
    let query = {};

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
          message: 'You can only view showings for your own listings'
        });
      }

      query.listing = listingId;
    } else {
      // Get all listings owned by this agent
      const agentListings = await Listing.find({ createdBy: agentId }).select('_id');
      const listingIds = agentListings.map(listing => listing._id);

      if (listingIds.length === 0) {
        return res.json({
          showings: [],
          count: 0,
          page: 1,
          totalPages: 0,
          message: 'No listings found for this agent'
        });
      }

      query.listing = { $in: listingIds };
    }

    // Filter by status if provided
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      query.status = status;
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
    const [showings, totalCount] = await Promise.all([
      Showing.find(query)
        .populate({
          path: 'listing',
          select: 'address zipCode price images createdBy',
          populate: {
            path: 'createdBy',
            select: 'name email phone'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),
      Showing.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageLimit);

    res.json({
      showings,
      count: totalCount,
      page: currentPage,
      totalPages,
      message: showings.length === 0 ? 'No showing requests found' : undefined
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error fetching showings', error.message, { type: error.name })
    );
  }
};

// Get count of pending showings for agent's listings (PROTECTED - agent only)
export const getPendingShowingsCount = async (req, res) => {
  try {
    const agentId = req.agent._id;

    // Get all listings owned by this agent
    const agentListings = await Listing.find({ createdBy: agentId }).select('_id');
    const listingIds = agentListings.map(listing => listing._id);

    if (listingIds.length === 0) {
      return res.json({ count: 0 });
    }

    // Count pending showings for these listings
    const count = await Showing.countDocuments({
      listing: { $in: listingIds },
      status: 'pending'
    });

    res.json({ count });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error fetching pending showings count', error.message, { type: error.name })
    );
  }
};

// Get single showing by ID (PUBLIC or PROTECTED depending on use case)
export const getShowingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    const showing = await Showing.findById(id).populate({
      path: 'listing',
      select: 'address zipCode price images createdBy',
      populate: {
        path: 'createdBy',
        select: 'name email phone'
      }
    });

    if (!showing) {
      return res.status(404).json(handleNotFoundError('Showing', id));
    }

    res.json({ showing });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error fetching showing', error.message, { type: error.name })
    );
  }
};

// Update showing status (PROTECTED - agent only, must own the listing)
export const updateShowingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduledDate } = req.body;
    const agentId = req.agent._id;

    // Validate ID format
    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    // Allow front-end to send 'approved'/'rejected' and map to model statuses
    const inputStatus = status;
    // Map external statuses to internal model statuses
    const statusMap = {
      approved: 'confirmed',
      rejected: 'cancelled'
    };

    const internalStatus = statusMap[inputStatus] || inputStatus;

    // Validate status value against model-allowed statuses
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!internalStatus || !validStatuses.includes(internalStatus)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')} or mapped from approved/rejected`
      });
    }

    // Find showing and verify it exists
    const showing = await Showing.findById(id).populate('listing');
    if (!showing) {
      return res.status(404).json(handleNotFoundError('Showing', id));
    }

    // Verify agent owns the listing
    if (String(showing.listing.createdBy) !== String(agentId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update showings for your own listings'
      });
    }

    // If approving (confirmed), require a scheduledDate and validate it
    if (internalStatus === 'confirmed') {
      if (!scheduledDate) {
        return res.status(400).json({
          error: 'scheduledDate required',
          message: 'Provide a scheduledDate (ISO string) when approving a showing'
        });
      }

      const dateObj = new Date(scheduledDate);
      if (isNaN(dateObj.getTime()) || dateObj <= new Date()) {
        return res.status(400).json({
          error: 'Invalid scheduledDate',
          message: 'scheduledDate must be a valid date/time in the future'
        });
      }

      showing.scheduledAt = dateObj;
    } else {
      // Clear any previously scheduled date when not confirmed
      showing.scheduledAt = null;
    }

    // Update status (use internal mapped status)
    showing.status = internalStatus;
    showing.updatedAt = Date.now();
    await showing.save();

    // Populate for response
    await showing.populate({
      path: 'listing',
      select: 'address zipCode price createdBy',
      populate: {
        path: 'createdBy',
        select: 'name email phone'
      }
    });

    res.json({
      message: 'Showing status updated successfully',
      showing
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json(handleValidationError(error));
    }
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error updating showing status', error.message, { type: error.name })
    );
  }
};

// Delete showing (PROTECTED - agent only, must own the listing)
export const deleteShowing = async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.agent._id;

    // Validate ID format
    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    // Find showing and verify it exists
    const showing = await Showing.findById(id).populate('listing');
    if (!showing) {
      return res.status(404).json(handleNotFoundError('Showing', id));
    }

    // Verify agent owns the listing
    if (String(showing.listing.createdBy) !== String(agentId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete showings for your own listings'
      });
    }

    // Delete showing
    await Showing.findByIdAndDelete(id);

    res.json({
      message: 'Showing deleted successfully',
      showing: {
        _id: showing._id,
        listing: showing.listing._id,
        name: showing.name,
        email: showing.email
      }
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error deleting showing', error.message, { type: error.name })
    );
  }
};
