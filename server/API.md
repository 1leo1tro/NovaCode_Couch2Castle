# Couch2Castle API Documentation

Base URL: `http://localhost:5001/api`

## Listings Endpoints

### Get All Listings
**GET** `/listings`

Returns property listings. Defaults to active listings only; pass `status` to override.

**Authentication:** Not required

**Query Parameters:**
- `keyword` (optional) - Case-insensitive search across address, ZIP code, and status
- `minPrice` (optional) - Filter by minimum price
- `maxPrice` (optional) - Filter by maximum price
- `minSquareFeet` (optional) - Filter by minimum square footage
- `maxSquareFeet` (optional) - Filter by maximum square footage
- `zipCode` (optional) - Filter by ZIP code
- `status` (optional) - Filter by status (`active`, `pending`, `sold`, `inactive`); defaults to `active`
- `page` (optional) - Page number (default: 1, max: 10000)
- `limit` (optional) - Results per page (default: 10, max: 100)
- `sortBy` (optional) - Sort field (`price`, `squareFeet`, `createdAt`, `updatedAt`)
- `order` (optional) - Sort direction (`asc`, `desc`)

**Example Requests:**

Filter by price range:
```
GET /api/listings?minPrice=200000&maxPrice=300000
```

Search by keyword:
```
GET /api/listings?keyword=huntsville
```

Combined filters:
```
GET /api/listings?zipCode=35801&minPrice=250000
```

**Example Response:**
```json
{
  "listings": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "price": 250000,
      "address": "123 Main St, Huntsville, AL 35801",
      "description": "Charming 3-bedroom home",
      "squareFeet": 1500,
      "images": [],
      "status": "active",
      "zipCode": "35801",
      "createdBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "name": "John Smith",
        "phone": "2051234567"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get Listing by ID
**GET** `/listings/:id`

Returns a single listing by ID.

**Authentication:** Not required

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the listing

**Example Request:**
```
GET /api/listings/507f1f77bcf86cd799439011
```

**Example Response:**
```json
{
  "listing": {
    "_id": "507f1f77bcf86cd799439011",
    "price": 250000,
    "address": "123 Main St, Huntsville, AL 35801",
    "description": "Charming 3-bedroom home",
    "squareFeet": 1500,
    "images": [],
    "status": "active",
    "zipCode": "35801",
    "createdBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Smith",
      "phone": "2051234567"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "message": "Listing not found"
}
```

---

## Showing Request Endpoints

### Create Showing Request (Public)
**POST** `/showings`

Submit a tour/showing request for a property listing.

**Authentication:** None required (public endpoint)

**Request Body:**
```json
{
  "listing": "65f8b3c4a1234567890abcde",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "preferredDate": "2026-03-15T14:00:00.000Z",
  "message": "I'm interested in viewing this property next week."
}
```

**Field Requirements:**
- `listing` (required) - MongoDB ObjectId of the listing
- `name` (required) - Requester's name (2-100 characters)
- `email` (required) - Valid email address
- `phone` (required) - Phone number
- `preferredDate` (required) - Must be a future date/time
- `message` (optional) - Additional notes (max 1000 characters)

**Example Response (201 Created):**
```json
{
  "message": "Showing request submitted successfully",
  "showing": {
    "_id": "65f8b3c4a1234567890abcdf",
    "listing": {
      "_id": "65f8b3c4a1234567890abcde",
      "address": "123 Main St, Huntsville, AL 35801",
      "zipCode": "35801",
      "price": 250000,
      "createdBy": {
        "_id": "65f8b3c4a1234567890abcaa",
        "name": "Agent Smith",
        "email": "agent@example.com",
        "phone": "(555) 987-6543"
      }
    },
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "preferredDate": "2026-03-15T14:00:00.000Z",
    "message": "I'm interested in viewing this property next week.",
    "status": "pending",
    "createdAt": "2026-02-15T10:30:00.000Z",
    "updatedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

---

### Get All Showings for Agent (Protected)
**GET** `/showings`

Get all showing requests for the authenticated agent's listings.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `listingId` (optional) - Filter by specific listing ID
- `status` (optional) - Filter by status: `pending`, `confirmed`, `completed`, `cancelled`
- `page` (optional) - Page number for pagination (default: 1)
- `limit` (optional) - Results per page (default: 10)

**Example Requests:**
```
GET /api/showings
GET /api/showings?status=pending
GET /api/showings?listingId=65f8b3c4a1234567890abcde
GET /api/showings?page=2&limit=20
```

**Example Response (200 OK):**
```json
{
  "showings": [
    {
      "_id": "65f8b3c4a1234567890abcdf",
      "listing": {
        "_id": "65f8b3c4a1234567890abcde",
        "address": "123 Main St, Huntsville, AL 35801",
        "zipCode": "35801",
        "price": 250000
      },
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "(555) 123-4567",
      "preferredDate": "2026-03-15T14:00:00.000Z",
      "message": "I'm interested in viewing this property.",
      "status": "pending",
      "createdAt": "2026-02-15T10:30:00.000Z"
    }
  ],
  "count": 15,
  "page": 1,
  "totalPages": 2
}
```

---

### Get Pending Showings Count (Protected)
**GET** `/showings/count/pending`

Get the count of pending showing requests for the authenticated agent's listings.

**Authentication:** Required (Bearer token)

**Example Response (200 OK):**
```json
{
  "count": 5
}
```

---

### Get Showing by ID (Public)
**GET** `/showings/:id`

Get details of a specific showing request.

**URL Parameters:**
- `id` (required) - Showing ID

**Example Request:**
```
GET /api/showings/65f8b3c4a1234567890abcdf
```

**Example Response (200 OK):**
```json
{
  "showing": {
    "_id": "65f8b3c4a1234567890abcdf",
    "listing": {
      "_id": "65f8b3c4a1234567890abcde",
      "address": "123 Main St, Huntsville, AL 35801"
    },
    "name": "John Doe",
    "email": "john@example.com",
    "status": "pending"
  }
}
```

---

### Update Showing Status (Protected)
**PATCH** `/showings/:id` or **PATCH** `/showings/:id/status`

Update the status of a showing request. Only the listing owner (agent) can update.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (required) - Showing ID

**Behavior & Notes:**
- The API accepts both the internal model status values (`pending`, `confirmed`, `completed`, `cancelled`) and agent-facing values `approved`/`rejected`.
- `approved` is mapped to `confirmed` in the database; `rejected` is mapped to `cancelled`.
- When approving a showing (i.e. `status` -> `approved` or `confirmed`), the request MUST include a `scheduledDate` (ISO 8601 string) that represents the confirmed date/time for the showing. The `scheduledDate` must be a valid date/time in the future. The API stores this value in the `scheduledAt` field on the `Showing` document.
- When setting a status other than `confirmed` (e.g. `rejected`/`cancelled`), any existing `scheduledAt` value will be cleared.

**Request Body (approve and schedule):**
```json
{
  "status": "approved",
  "scheduledDate": "2026-03-05T14:30:00.000Z"
}
```

**Request Body (other status change):**
```json
{
  "status": "rejected"
}
```

**Valid Status Values (accepted):**
- `pending`
- `confirmed` (internal)
- `completed`
- `cancelled` (internal)
- Agent-facing: `approved` (maps to `confirmed`), `rejected` (maps to `cancelled`)

**Example Response (200 OK) — approved and scheduled:**
```json
{
  "message": "Showing status updated successfully",
  "showing": {
    "_id": "65f8b3c4a1234567890abcdf",
    "status": "confirmed",
    "scheduledAt": "2026-03-05T14:30:00.000Z",
    "updatedAt": "2026-02-15T15:00:00.000Z"
  }
}
```

**Error Response (400 Bad Request — missing/invalid scheduledDate):**
```json
{
  "error": "scheduledDate required",
  "message": "Provide a scheduledDate (ISO string) when approving a showing"
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "Access denied",
  "message": "You can only update showings for your own listings"
}
```

---

### Delete Showing (Protected)
**DELETE** `/showings/:id`

Delete a showing request. Only the listing owner can delete.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (required) - Showing ID

**Example Response (200 OK):**
```json
{
  "message": "Showing deleted successfully",
  "showing": {
    "_id": "65f8b3c4a1234567890abcdf",
    "listing": "65f8b3c4a1234567890abcde",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "Access denied",
  "message": "You can only delete showings for your own listings"
}
```
