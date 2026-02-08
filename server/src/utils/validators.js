/**
 * Query parameter validation utilities
 */

import mongoose from 'mongoose';
import { handleQueryParamError } from './errorHandler.js';

/**
 * Validate and parse a numeric query parameter
 * @param {string} paramName - Parameter name
 * @param {string} value - Parameter value
 * @param {object} options - Validation options (min, max, allowZero)
 * @returns {object} { isValid, error, parsedValue }
 */
export const validateNumericParam = (paramName, value, options = {}) => {
  const { min = 0, max = Infinity, allowZero = false } = options;

  if (value === undefined || value === null || value === '') {
    return { isValid: true, parsedValue: null };
  }

  const parsed = Number(value);

  if (isNaN(parsed)) {
    return {
      isValid: false,
      error: handleQueryParamError(
        paramName,
        value,
        `${paramName} must be a valid number`
      )
    };
  }

  if (!allowZero && parsed === 0) {
    return {
      isValid: false,
      error: handleQueryParamError(
        paramName,
        value,
        `${paramName} must be greater than 0`
      )
    };
  }

  if (parsed < min) {
    return {
      isValid: false,
      error: handleQueryParamError(
        paramName,
        value,
        `${paramName} must be at least ${min}`
      )
    };
  }

  if (parsed > max) {
    return {
      isValid: false,
      error: handleQueryParamError(
        paramName,
        value,
        `${paramName} must not exceed ${max}`
      )
    };
  }

  return { isValid: true, parsedValue: parsed };
};

/**
 * Validate ZIP code format
 * @param {string} zipCode - ZIP code to validate
 * @returns {object} { isValid, error }
 */
export const validateZipCode = (zipCode) => {
  if (!zipCode || zipCode === '') {
    return { isValid: true };
  }

  if (!/^\d{5}$/.test(zipCode)) {
    return {
      isValid: false,
      error: handleQueryParamError(
        'zipCode',
        zipCode,
        'zipCode must be a 5-digit number'
      )
    };
  }

  return { isValid: true };
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {object} { isValid, error }
 */
export const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      isValid: false,
      error: {
        message: 'Invalid ID format',
        error: 'The provided ID is not a valid MongoDB ObjectId',
        id,
        expectedFormat: '24 hexadecimal characters'
      }
    };
  }

  return { isValid: true };
};

/**
 * Validate price range parameters
 * @param {string} minPrice - Minimum price
 * @param {string} maxPrice - Maximum price
 * @returns {object} { isValid, error, query }
 */
export const validatePriceRange = (minPrice, maxPrice) => {
  const query = {};

  // Validate minPrice
  if (minPrice) {
    const validation = validateNumericParam('minPrice', minPrice, { min: 0 });
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }
    if (validation.parsedValue !== null) {
      query.$gte = validation.parsedValue;
    }
  }

  // Validate maxPrice
  if (maxPrice) {
    const validation = validateNumericParam('maxPrice', maxPrice, { min: 0 });
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }
    if (validation.parsedValue !== null) {
      query.$lte = validation.parsedValue;
    }
  }

  // Validate range logic
  if (query.$gte && query.$lte && query.$gte > query.$lte) {
    return {
      isValid: false,
      error: {
        message: 'Invalid query parameters',
        error: 'minPrice cannot be greater than maxPrice',
        minPrice: query.$gte,
        maxPrice: query.$lte
      }
    };
  }

  return { isValid: true, query };
};

/**
 * Validate square footage range parameters
 * @param {string} minSquareFeet - Minimum square feet
 * @param {string} maxSquareFeet - Maximum square feet
 * @returns {object} { isValid, error, query }
 */
export const validateSquareFeetRange = (minSquareFeet, maxSquareFeet) => {
  const query = {};

  // Validate minSquareFeet
  if (minSquareFeet) {
    const validation = validateNumericParam('minSquareFeet', minSquareFeet, { min: 0 });
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }
    if (validation.parsedValue !== null) {
      query.$gte = validation.parsedValue;
    }
  }

  // Validate maxSquareFeet
  if (maxSquareFeet) {
    const validation = validateNumericParam('maxSquareFeet', maxSquareFeet, { min: 0 });
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }
    if (validation.parsedValue !== null) {
      query.$lte = validation.parsedValue;
    }
  }

  // Validate range logic
  if (query.$gte && query.$lte && query.$gte > query.$lte) {
    return {
      isValid: false,
      error: {
        message: 'Invalid query parameters',
        error: 'minSquareFeet cannot be greater than maxSquareFeet',
        minSquareFeet: query.$gte,
        maxSquareFeet: query.$lte
      }
    };
  }

  return { isValid: true, query };
};

/**
 * Validate pagination parameters
 * @param {string} page - Page number
 * @param {string} limit - Items per page
 * @returns {object} { isValid, error, pagination }
 */
export const validatePagination = (page, limit) => {
  const pagination = { page: 1, limit: 10 }; // Defaults

  // Validate page
  if (page) {
    const validation = validateNumericParam('page', page, { min: 1, max: 10000 });
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }
    if (validation.parsedValue !== null) {
      pagination.page = validation.parsedValue;
    }
  }

  // Validate limit
  if (limit) {
    const validation = validateNumericParam('limit', limit, { min: 1, max: 100 });
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }
    if (validation.parsedValue !== null) {
      pagination.limit = validation.parsedValue;
    }
  }

  return { isValid: true, pagination };
};

/**
 * Validate status parameter
 * @param {string} status - Listing status
 * @returns {object} { isValid, error }
 */
export const validateStatus = (status) => {
  if (!status || status === '') {
    return { isValid: true };
  }

  const validStatuses = ['active', 'pending', 'sold', 'inactive'];

  if (!validStatuses.includes(status)) {
    return {
      isValid: false,
      error: handleQueryParamError(
        'status',
        status,
        `status must be one of: ${validStatuses.join(', ')}`
      )
    };
  }

  return { isValid: true };
};

/**
 * Validate sort parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} order - Sort order (asc/desc)
 * @returns {object} { isValid, error, sort }
 */
export const validateSort = (sortBy, order) => {
  if (!sortBy) {
    return { isValid: true, sort: { createdAt: -1 } }; // Default sort
  }

  const validSortFields = ['price', 'squareFeet', 'createdAt', 'updatedAt'];

  if (!validSortFields.includes(sortBy)) {
    return {
      isValid: false,
      error: handleQueryParamError(
        'sortBy',
        sortBy,
        `sortBy must be one of: ${validSortFields.join(', ')}`
      )
    };
  }

  const validOrders = ['asc', 'desc', '1', '-1'];
  const sortOrder = order || 'asc';

  if (!validOrders.includes(sortOrder)) {
    return {
      isValid: false,
      error: handleQueryParamError(
        'order',
        sortOrder,
        'order must be one of: asc, desc, 1, -1'
      )
    };
  }

  const orderValue = (sortOrder === 'asc' || sortOrder === '1') ? 1 : -1;

  return { isValid: true, sort: { [sortBy]: orderValue } };
};
