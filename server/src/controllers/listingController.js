import Listing from '../models/Listing.js';
import mongoose from 'mongoose';

// Mock Data
const mockListings = [
  {
    id: 1,
    price: 250000,
    address: "123 Main St, Huntsville, AL 35801",
    squareFeet: 1500,
    thumbnail: "https://via.placeholder.com/300",
    status: "active"
  },
  {
    id: 2,
    price: 350000,
    address: "456 Oak Ave, Huntsville, AL 35802",
    squareFeet: 2200,
    thumbnail: "https://via.placeholder.com/300",
    status: "active"
  },
  {
    id: 3,
    price: 180000,
    address: "789 Pine Rd, Madison, AL 35758",
    squareFeet: 1200,
    thumbnail: "https://via.placeholder.com/300",
    status: "active"
  }
];

// Create a new listing
export const createListing = async (req, res) => {
  try {
    const listing = await Listing.create(req.body);
    res.status(201).json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        error: error.message,
        details: error.errors
      });
    }
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({
        message: 'Database connection error',
        error: 'Unable to connect to the database. Please try again later.',
        type: 'DATABASE_CONNECTION_ERROR'
      });
    }
    res.status(500).json({
      message: 'Error creating listing',
      error: error.message,
      type: error.name
    });
  }
};

// Get all listings
export const getAllListings = async (req, res) => {
  try {
    const { minPrice, maxPrice, zipCode } = req.query;

    let query = {};

    // Validate and filter by price range
    if (minPrice || maxPrice) {
      query.price = {};

      if (minPrice) {
        const parsedMinPrice = parseInt(minPrice);
        if (isNaN(parsedMinPrice) || parsedMinPrice < 0) {
          return res.status(400).json({
            message: 'Invalid query parameter',
            error: 'minPrice must be a valid non-negative number',
            parameter: 'minPrice',
            value: minPrice
          });
        }
        query.price.$gte = parsedMinPrice;
      }

      if (maxPrice) {
        const parsedMaxPrice = parseInt(maxPrice);
        if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
          return res.status(400).json({
            message: 'Invalid query parameter',
            error: 'maxPrice must be a valid non-negative number',
            parameter: 'maxPrice',
            value: maxPrice
          });
        }
        query.price.$lte = parsedMaxPrice;
      }

      // Validate price range logic
      if (minPrice && maxPrice && query.price.$gte > query.price.$lte) {
        return res.status(400).json({
          message: 'Invalid query parameters',
          error: 'minPrice cannot be greater than maxPrice',
          minPrice: query.price.$gte,
          maxPrice: query.price.$lte
        });
      }
    }

    // Validate and filter by ZIP code
    if (zipCode) {
      // Basic ZIP code validation (5 digits)
      if (!/^\d{5}$/.test(zipCode)) {
        return res.status(400).json({
          message: 'Invalid query parameter',
          error: 'zipCode must be a 5-digit number',
          parameter: 'zipCode',
          value: zipCode
        });
      }
      query.zipCode = zipCode;
    }

    const filtered = await Listing.find(query);

    // Distinguish between empty results and successful query
    if (filtered.length === 0) {
      return res.json({
        listings: [],
        count: 0,
        message: 'No listings found matching the specified criteria'
      });
    }

    res.json({ listings: filtered, count: filtered.length });
  } catch (error) {
    // Check for database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({
        message: 'Database connection error',
        error: 'Unable to connect to the database. Please try again later.',
        type: 'DATABASE_CONNECTION_ERROR'
      });
    }

    // Generic server error
    res.status(500).json({
      message: 'Error fetching listings',
      error: error.message,
      type: error.name
    });
  }
};

// Get single listing by id
export const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid listing ID format',
        error: 'The provided ID is not a valid MongoDB ObjectId',
        id: id
      });
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
        error: `No listing exists with ID: ${id}`
      });
    }

    res.json({ listing });
  } catch (error) {
    // Check for database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({
        message: 'Database connection error',
        error: 'Unable to connect to the database. Please try again later.',
        type: 'DATABASE_CONNECTION_ERROR'
      });
    }

    // Generic server error
    res.status(500).json({
      message: 'Error fetching listing',
      error: error.message,
      type: error.name
    });
  }
};