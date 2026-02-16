import axios from 'axios';

const API_BASE_URL = '/api/listings';

// Create a new listing
export const createListing = async (listingData) => {
  try {
    const response = await axios.post(API_BASE_URL, listingData);
    return {
      success: true,
      message: response.data.message || 'Listing created successfully',
      listing: response.data.listing
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Failed to create listing';

    const errorDetails = error.response?.data?.details || {};

    return {
      success: false,
      message: errorMessage,
      error: error.response?.status,
      details: errorDetails
    };
  }
};

// Get all listings
export const getAllListings = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.zipCode) params.append('zipCode', filters.zipCode);
    if (filters.status) params.append('status', filters.status);

    const response = await axios.get(
      `${API_BASE_URL}${params ? '?' + params : ''}`
    );
    
    return {
      success: true,
      listings: response.data.data || [],
      count: response.data.count
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      'Failed to fetch listings';

    return {
      success: false,
      message: errorMessage,
      error: error.response?.status,
      listings: []
    };
  }
};

// Get single listing by ID
export const getListingById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    
    return {
      success: true,
      listing: response.data.listing
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      'Failed to fetch listing';

    return {
      success: false,
      message: errorMessage,
      error: error.response?.status
    };
  }
};

// Update listing
export const updateListing = async (id, listingData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, listingData);
    
    return {
      success: true,
      message: response.data.message || 'Listing updated successfully',
      listing: response.data.listing
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Failed to update listing';

    const errorDetails = error.response?.data?.details || {};

    return {
      success: false,
      message: errorMessage,
      error: error.response?.status,
      details: errorDetails
    };
  }
};

// Delete listing
export const deleteListing = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    
    return {
      success: true,
      message: response.data.message || 'Listing deleted successfully'
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      'Failed to delete listing';

    return {
      success: false,
      message: errorMessage,
      error: error.response?.status
    };
  }
};
