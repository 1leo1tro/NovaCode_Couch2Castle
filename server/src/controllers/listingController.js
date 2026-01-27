import Listing from '../models/Listing.js';

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

// Get all listings
export const getAllListings = async (req, res) => {
  try {
    const { minPrice, maxPrice, zipCode } = req.query;
    
    let query = {};
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = parseInt(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = parseInt(maxPrice);
      }
    }
    
    // Filter by ZIP code
    if (zipCode) {
      query.zipCode = zipCode;
    }
    
    const filtered = await Listing.find(query);
    
    res.json({ listings: filtered, count: filtered.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
};

// Get single listing by id
export const getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    res.json({ listing });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listing', error: error.message });
  }
};