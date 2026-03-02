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

All 28 listing tests pass (28 across 9 suites), plus 53 showing tests pass (53 across 3 suites).

| Suite | File | Tests |
|---|---|---|
| Listing API | `listings.test.js` | 28 |
| Showing API | `showings.test.js` | 53 |

### Notes

- Tests use MongoDB Memory Server — no external database connection required
- Each test runs in isolation with a fresh database state
- The test suite automatically cleans up after itself
- Tests are compatible with ES modules (`type: "module"` in `server/package.json`)
- The seed script is excluded from test coverage via `server/jest.config.js`
- Agent documents are created once per suite (not per test) to avoid repeated bcrypt hashing overhead

---

## Showing Request Tests (API)

**Location:** `server/src/tests/showings.test.js`

### Test Framework

Same stack as listing tests: Jest, Supertest, MongoDB Memory Server.

### Running Tests

```bash
cd server
npm test               # Run all tests (listings + showings)
npm run test:coverage  # Run with coverage report
```

### Test Coverage

#### 1. POST /api/showings — Create Showing Request (Public)

**Valid Requests**
- Creates a showing with all required fields → 201
- Status defaults to `pending` → 201
- Creates a showing with an optional message → 201
- Populates listing details (address, zipCode, price) in the response → 201
- Endpoint is accessible without authentication → 201

**Required Field Validation**
- Missing `listing` ID → 400
- Missing `name` → 400
- Missing `email` → 400
- Missing `phone` → 400
- Missing `preferredDate` → 400

**Field Format Validation**
- Invalid email format → 400
- Phone number containing letters → 400
- `preferredDate` set in the past → 400
- `name` shorter than 2 characters → 400
- `name` longer than 100 characters → 400
- `message` exceeding 1000 characters → 400

**Listing Validation**
- Invalid listing ID format (not a valid ObjectId) → 400
- Valid ObjectId that does not match any listing → 404

**Response Structure**
- Response contains all expected fields: `_id`, `listing`, `name`, `email`, `phone`, `preferredDate`, `status`, `createdAt`, `updatedAt`

---

#### 2. GET /api/showings — Fetch Agent's Showing Requests (Protected)

**Authentication**
- No token → 401
- Invalid/malformed token → 401
- Valid JWT token → 200

**Ownership Verification**
- Returns only showings for listings owned by the authenticated agent
- Agent with no listings receives an empty list with an explanatory message

**Filtering by Status**
- `status=pending` returns only pending showings
- `status=confirmed` returns only confirmed showings
- `status=cancelled` returns only cancelled showings
- `status=completed` returns only completed showings
- Unrecognised status value → 400 with error details
- No status filter returns all showings across all statuses

**Filtering by Listing ID**
- `listingId` param returns only showings for that specific listing
- `listingId` belonging to another agent → 403 Access denied
- `listingId` with a valid ObjectId that doesn't exist → 404
- Invalid `listingId` format → 400

**Pagination**
- `page` and `limit` params return the correct page of results
- `totalPages` and `count` reflect the full result set

**Response Structure**
- Top-level shape: `showings`, `count`, `page`, `totalPages`
- Each showing has listing details populated (address, zipCode, price)
- Results sorted by `createdAt` descending (newest first)

**Empty Results**
- Empty result set includes a `message` field: `"No showing requests found"`

---

#### 3. PATCH /api/showings/:id — Approve / Reject Showing (Protected)

**Authentication**
- No token → 401
- Invalid token → 401

**Valid Status Updates**
- Approve a showing (`status: "confirmed"`) → 200
- Reject a showing (`status: "cancelled"`) → 200
- Mark a showing as completed → 200
- Reset a showing back to pending → 200

**Validation**
- Missing `status` field in request body → 400
- Unrecognised `status` value (e.g., `"approved"`) → 400 with valid values listed
- Invalid showing ID format → 400
- Valid ObjectId that doesn't match any showing → 404

**Authorization — Ownership Verification**
- Agent cannot update a showing for another agent's listing → 403 Access denied
- Listing owner can update showing status → 200

**Response Structure**
- Returns `message: "Showing status updated successfully"` and the updated showing
- Updated showing includes populated listing details

---

### Showing Test Results

All 53 tests pass:
- 19 tests for `POST /api/showings`
- 22 tests for `GET /api/showings`
- 12 tests for `PATCH /api/showings/:id`

### Showing Test Notes

- Two reusable Agent documents are created once (`beforeAll`) to avoid repeated bcrypt overhead
- Only showings and listings are cleared between tests; agents persist for the entire suite
- JWT tokens are generated using the same `JWT_SECRET` that the `protect` middleware reads, so auth flows are tested end-to-end against the real middleware
- `createdAt` timestamps are explicitly set when seeding showings in the sort-order test, since in-memory DB operations complete within the same millisecond

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
            ├── listings.test.js      # Backend API tests for GET /api/listings
            └── showings.test.js      # Backend API tests for showing requests
```
