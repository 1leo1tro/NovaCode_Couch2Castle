# Testing Documentation

This document covers all automated tests for the Couch2Castle project, including both the backend API tests and the frontend component tests.

---

## Table of Contents

1. [Backend Tests (API)](#backend-tests-api)
2. [Frontend Tests (UI)](#frontend-tests-ui)
3. [Database Seed Script](#database-seed-script)

---

## Backend Tests (API)

**Location:** `server/src/tests/listings.test.js`

### Test Framework

- **Jest**: Test runner and assertion library
- **Supertest**: HTTP testing library for Express apps
- **MongoDB Memory Server**: In-memory MongoDB instance for isolated testing

### Running Tests

```bash
cd server
npm test               # Run all tests
npm run test:watch     # Re-run on file changes
npm run test:coverage  # Run with coverage report
```

### Test Coverage

#### 1. Active Listings
- Returns all active listings
- Filters by listing status

#### 2. Data Structure Validation
- Verifies correct response structure
- Validates data types for all fields
- Ensures required fields are present

#### 3. Price Range Filtering
- Filter by minimum price (`minPrice` query param)
- Filter by maximum price (`maxPrice` query param)
- Filter by price range (both min and max)
- Handle exact price matches

#### 4. Square Footage Filtering
- Documents expected behavior for future implementation
- Note: Current API doesn't support square footage filtering

#### 5. ZIP Code Filtering
- Filter by ZIP code (`zipCode` query param)
- Handle ZIP+4 format (e.g., 35801-1234)
- Return empty results for non-existent ZIP codes

#### 6. Combined Filters
- Multiple filters applied simultaneously
- ZIP code + price range combination

#### 7. Edge Cases
- Empty results when no listings exist
- Invalid query parameters (returns 400 error)
- Negative price values
- Min price exceeds max price
- Very large price values
- Empty string parameters
- Multiple query parameters with same name

#### 8. Response Format
- Consistent JSON structure
- Count field matches array length

#### 9. Error Handling
- Database connection errors
- Server errors return appropriate status codes

### Backend Test Results

All 28 tests pass:
- 28 test cases across 9 test suites
- Covers positive, negative, and edge case scenarios
- Uses in-memory MongoDB for fast, isolated tests

### Notes

- Tests use MongoDB Memory Server — no external database connection required
- Each test runs in isolation with a fresh database state
- The test suite automatically cleans up after itself
- Tests are compatible with ES modules (`type: "module"` in `server/package.json`)
- The seed script is excluded from test coverage via `server/jest.config.js`

---

## Frontend Tests (UI)

**Location:** `client/src/tests/Listings.test.jsx`

### Test Framework

- **Vitest**: Test runner (integrates natively with Vite)
- **React Testing Library**: Component rendering and querying
- **@testing-library/user-event**: Realistic user interaction simulation
- **@testing-library/jest-dom**: Extended DOM matchers (`toBeInTheDocument`, etc.)
- **jsdom**: Browser DOM environment for Node.js

### Running Tests

```bash
cd client
npm test               # Run all tests once
npm run test:watch     # Re-run on file changes
npm run test:coverage  # Run with V8 coverage report
```

### Test Coverage

#### 1. Initial Render
- Shows loading indicator while API request is in flight
- Calls `GET /api/listings` with no query params on mount
- Renders the "All Listings" page heading

#### 2. Listing Cards
- Renders a card for every listing returned by the API
- Formats price with commas (e.g. $1,250,000)
- Displays ZIP code and square footage
- Shows a status badge for non-active listings (pending, sold, inactive)
- Suppresses badge for listings with `active` status
- Shows agent name from `createdBy`; falls back to "Listed by Agent" when absent
- "Schedule a Tour" link points to the correct `/property/:id` route
- Displays "No image" placeholder when `images` array is empty

#### 3. Empty and Error States
- Shows generic empty message when no listings exist and no filters are active
- Shows filter-specific message ("No listings found matching your criteria.") when filters are set but return no results
- Displays error message from API response body on failure
- Displays fallback error message ("Failed to load listings") when no response body is available
- Handles missing `listings` key in API response gracefully (treats as empty)

#### 4. Filter Inputs
- All four filter inputs render: keyword, minPrice, maxPrice, zipCode
- Each input updates its value as the user types (controlled component behaviour)

#### 5. Filter → API Integration
- Typing in the keyword field appends `keyword=` to the query string
- Typing in minPrice appends `minPrice=`
- Typing in maxPrice appends `maxPrice=`
- Typing in zipCode appends `zipCode=`
- Multiple active filters are combined into a single query string
- Empty filter fields are omitted from the query string entirely

#### 6. Create Listing Button
- Visible when the user is authenticated
- Hidden when the user is not authenticated

#### 7. Edit and Delete Actions
- Edit and Delete controls appear for the owner of a listing
- Controls are hidden for a non-owner authenticated user
- Controls are hidden for unauthenticated users
- Edit button links to `/listings/edit/:id`
- Clicking Delete calls `DELETE /api/listings/:id` and refreshes the listing list
- Cancelling the confirm dialog skips the DELETE call entirely

#### 8. Search Form
- Submitting the search form does not cause page navigation (default prevented)

### Frontend Test Results

All 39 tests pass:
- 39 test cases across 8 test suites
- Covers rendering, filter state, API integration, auth-gating, and user interactions
- Listings.jsx statement coverage: ~92%, branch coverage: ~94%

---

## Database Seed Script

A seed script is available to populate the live database with diverse test listings for manual or integration testing:

```bash
cd server
npm run seed
```

The script (`server/src/scripts/seedListings.js`) inserts 25 listings covering:

| Category       | Coverage                                                     |
|----------------|--------------------------------------------------------------|
| Price          | $0 – $5,000,000 (boundary values at tier edges)              |
| Square footage | 0 – 10,000 sqft                                              |
| ZIP codes      | 11 unique codes, including ZIP+4 format                      |
| Statuses       | active (13), pending (5), inactive (4), sold (3)             |
| Edge cases     | Zero values, unusual price/sqft ratios, varying image arrays |

The seed script clears all existing listings before inserting, so it is safe to run repeatedly for a consistent baseline.

**Note:** The seed script connects to the live database configured in `server/.env`. It does not affect the in-memory database used by the backend test suite.

---

## Project Test File Structure

```
NovaCode_Couch2Castle/
├── client/
│   └── src/
│       └── tests/
│           ├── setup.js              # Vitest setup (jest-dom, auto-cleanup)
│           └── Listings.test.jsx     # Frontend tests for the Listings page
└── server/
    └── src/
        ├── scripts/
        │   └── seedListings.js       # Database seed script (25 listings)
        └── tests/
            └── listings.test.js      # Backend API tests for GET /api/listings
```
