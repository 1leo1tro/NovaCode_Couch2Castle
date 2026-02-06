# API Tests for Listings Endpoint

This directory contains automated API tests for the GET /api/listings endpoint.

## Test Framework

- **Jest**: Test runner and assertion library
- **Supertest**: HTTP testing library for Express apps
- **MongoDB Memory Server**: In-memory MongoDB instance for isolated testing

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The test suite covers the following areas:

### 1. Active Listings
- Returns all active listings
- Filters by listing status

### 2. Data Structure Validation
- Verifies correct response structure
- Validates data types for all fields
- Ensures required fields are present

### 3. Price Range Filtering
- Filter by minimum price (`minPrice` query param)
- Filter by maximum price (`maxPrice` query param)
- Filter by price range (both min and max)
- Handle exact price matches

### 4. Square Footage Filtering
- Documents expected behavior for future implementation
- Note: Current API doesn't support square footage filtering

### 5. ZIP Code Filtering
- Filter by ZIP code (`zipCode` query param)
- Handle ZIP+4 format (e.g., 35801-1234)
- Return empty results for non-existent ZIP codes

### 6. Combined Filters
- Multiple filters applied simultaneously
- ZIP code + price range combination

### 7. Edge Cases
- Empty results when no listings exist
- Invalid query parameters (returns 500 error)
- Negative price values
- Min price exceeds max price
- Very large price values
- Empty string parameters
- Multiple query parameters with same name

### 8. Response Format
- Consistent JSON structure
- Count field matches array length

### 9. Error Handling
- Database connection errors
- Server errors return appropriate status codes

## Test Results

All 23 tests pass successfully:
- 23 test cases across 9 test suites
- Covers positive, negative, and edge case scenarios
- Uses in-memory MongoDB for fast, isolated tests

## Future Improvements

Based on the test suite, the following improvements are recommended:

1. **Input Validation**: Add validation for query parameters to prevent 500 errors on invalid input
2. **Square Footage Filtering**: Implement `minSquareFeet` and `maxSquareFeet` query parameters
3. **Status Filtering**: Add ability to filter by listing status (currently returns all statuses)
4. **Pagination**: Add support for paginating large result sets
5. **Sorting**: Allow sorting results by price, square footage, or date

## Database Seed Script

A seed script is available to populate the database with diverse test listings for manual or integration testing:

```bash
cd server
npm run seed
```

The script (`src/scripts/seedListings.js`) inserts 25 listings covering:

| Category        | Coverage                                                    |
|-----------------|-------------------------------------------------------------|
| Price           | $0 - $5,000,000 (boundary values at tier edges)            |
| Square footage  | 0 - 10,000 sqft                                            |
| ZIP codes       | 11 unique codes, including ZIP+4 format                     |
| Statuses        | active (13), pending (5), inactive (4), sold (3)            |
| Edge cases      | Zero values, unusual price/sqft ratios, varying image arrays|

The seed script clears all existing listings before inserting, so it is safe to run repeatedly for a consistent baseline.

**Note:** The seed script connects to the live database configured in `server/.env`. It does not affect the in-memory database used by the test suite.

## Test File Structure

```
src/
├── scripts/
│   └── seedListings.js     # Database seed script (25 test listings)
└── tests/
    ├── listings.test.js     # Main test file for GET /api/listings
    └── TestingREADME.md     # This file
```

## Notes

- Tests use MongoDB Memory Server, so no external database connection is required
- Each test runs in isolation with a fresh database
- The test suite automatically cleans up after itself
- Tests are compatible with ES modules (Node.js with `type: "module"`)
- The seed script is excluded from test coverage via `jest.config.js`
