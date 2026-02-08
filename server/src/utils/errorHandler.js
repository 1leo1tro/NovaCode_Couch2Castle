/**
 * Centralized error response utilities
 */

export const createErrorResponse = (message, error, details = null) => {
  const response = { message, error };
  if (details) response.details = details;
  return response;
};

export const handleValidationError = (error) => {
  return createErrorResponse(
    'Validation failed',
    'One or more fields failed validation',
    Object.keys(error.errors).reduce((acc, key) => {
      acc[key] = error.errors[key].message;
      return acc;
    }, {})
  );
};

export const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyPattern)[0];
  const value = error.keyValue[field];
  return createErrorResponse(
    'Duplicate entry',
    `A record with ${field} '${value}' already exists`,
    { field, value }
  );
};

export const handleDatabaseError = () => {
  return createErrorResponse(
    'Database connection error',
    'Unable to connect to the database. Please try again later.',
    { type: 'DATABASE_CONNECTION_ERROR' }
  );
};

export const handleInvalidIdError = (id) => {
  return createErrorResponse(
    'Invalid ID format',
    'The provided ID is not a valid MongoDB ObjectId',
    { id, expectedFormat: '24 hexadecimal characters' }
  );
};

export const handleNotFoundError = (resource, id) => {
  return createErrorResponse(
    `${resource} not found`,
    `No ${resource.toLowerCase()} exists with ID: ${id}`,
    { id }
  );
};

export const handleQueryParamError = (parameter, value, expectedFormat) => {
  return createErrorResponse(
    'Invalid query parameter',
    expectedFormat,
    { parameter, value }
  );
};

export const isDatabaseConnectionError = (error) => {
  return error.name === 'MongoNetworkError' ||
         error.name === 'MongooseServerSelectionError';
};

export const isValidationError = (error) => {
  return error.name === 'ValidationError';
};

export const isDuplicateKeyError = (error) => {
  return error.code === 11000;
};

export const isCastError = (error) => {
  return error.name === 'CastError';
};
