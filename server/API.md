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
**PATCH** `/showings/:id`

Update the status of a showing request. Only the listing owner can update.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (required) - Showing ID

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Status Values:**
- `pending`
- `confirmed`
- `completed`
- `cancelled`

**Example Response (200 OK):**
```json
{
  "message": "Showing status updated successfully",
  "showing": {
    "_id": "65f8b3c4a1234567890abcdf",
    "status": "confirmed",
    "updatedAt": "2026-02-15T15:00:00.000Z"
  }
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

---

## Reports Endpoints

### Get Open Listings Report (Protected)
**GET** `/reports/open`

Returns active and pending listings aggregated by agent.

**Authentication:** Required (Bearer token)

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "agent": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "count": 4,
      "totalValue": 900000
    }
  ],
  "summary": {
    "totalAgents": 2,
    "totalListings": 7,
    "totalValue": 1650000
  }
}
```

---

### Get Closed Listings Report (Protected)
**GET** `/reports/closed`

Returns sold listings aggregated by agent, including count, total value, average sale price, and average days on market.

**Authentication:** Required (Bearer token)

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "agent": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "count": 3,
      "totalValue": 750000,
      "avgSalePrice": 250000,
      "avgDaysOnMarket": 42.5
    }
  ],
  "summary": {
    "totalAgents": 2,
    "totalListings": 5,
    "totalValue": 1250000,
    "avgSalePrice": 250000,
    "avgDaysOnMarket": 38.2
  }
}
```

**Notes:**
- Results sorted by `totalValue` descending
- `avgDaysOnMarket` uses each listing's `daysOnMarket` when available, otherwise falls back to `closingDate - createdAt` (or `updatedAt - createdAt` for older data)
- Listings with no associated agent are included with `agent: {}`

---

## Open House Endpoints

### Create Open House (Protected)
**POST** `/open-houses`

Create a new open house event for a listing.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "listing": "65f8b3c4a1234567890abcde",
  "date": "2026-03-15",
  "startTime": "10:00",
  "endTime": "12:00",
  "notes": "Please bring a valid ID for entry."
}
```

**Field Requirements:**
- `listing` (required) - MongoDB ObjectId of the listing
- `date` (required) - Date of the open house event
- `startTime` (required) - Start time in HH:MM format (e.g., 10:00)
- `endTime` (required) - End time in HH:MM format (e.g., 12:00)
- `notes` (optional) - Additional notes about the event

**Example Response (201 Created):**
```json
{
  "message": "Open house created successfully",
  "openHouse": {
    "_id": "65f8b3c4a1234567890abcdf",
    "listing": "65f8b3c4a1234567890abcde",
    "agentId": "65f8b3c4a1234567890abce1",
    "date": "2026-03-15",
    "startTime": "10:00",
    "endTime": "12:00",
    "notes": "Please bring a valid ID for entry.",
    "createdAt": "2026-02-15T10:30:00.000Z",
    "updatedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

---

### Get All Open Houses (Protected)
**GET** `/open-houses`

Get all open house events for the authenticated agent's listings.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `listingId` (optional) - Filter by specific listing ID
- `date` (optional) - Filter by date
- `page` (optional) - Page number for pagination (default: 1)
- `limit` (optional) - Results per page (default: 10)

**Example Requests:**
```
GET /api/open-houses
GET /api/open-houses?listingId=65f8b3c4a1234567890abcde
GET /api/open-houses?page=2&limit=20
```

**Example Response (200 OK):**
```json
{
  "openHouses": [
    {
      "_id": "65f8b3c4a1234567890abcdf",
      "listing": {
        "_id": "65f8b3c4a1234567890abcde",
        "address": "123 Main St, Huntsville, AL 35801"
      },
      "agentId": "65f8b3c4a1234567890abce1",
      "date": "2026-03-15",
      "startTime": "10:00",
      "endTime": "12:00",
      "notes": "Please bring a valid ID for entry.",
      "createdAt": "2026-02-15T10:30:00.000Z"
    }
  ],
  "count": 15,
  "page": 1,
  "totalPages": 2
}
```

---

### Get Open House by ID (Protected)
**GET** `/open-houses/:id`

Get details of a specific open house event.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (required) - Open house ID

**Example Request:**
```
GET /api/open-houses/65f8b3c4a1234567890abcdf
```

**Example Response (200 OK):**
```json
{
  "openHouse": {
    "_id": "65f8b3c4a1234567890abcdf",
    "listing": {
      "_id": "65f8b3c4a1234567890abcde",
      "address": "123 Main St, Huntsville, AL 35801"
    },
    "agentId": "65f8b3c4a1234567890abce1",
    "date": "2026-03-15",
    "startTime": "10:00",
    "endTime": "12:00",
    "notes": "Please bring a valid ID for entry.",
    "createdAt": "2026-02-15T10:30:00.000Z"
  }
}
```

---

### Update Open House (Protected)
**PUT** `/open-houses/:id`

Update an open house event. Only the listing owner can update.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (required) - Open house ID

**Request Body:**
```json
{
  "date": "2026-03-16",
  "startTime": "11:00",
  "endTime": "13:00"
}
```

**Example Response (200 OK):**
```json
{
  "message": "Open house updated successfully",
  "openHouse": {
    "_id": "65f8b3c4a1234567890abcdf",
    "date": "2026-03-16",
    "startTime": "11:00",
    "endTime": "13:00",
    "updatedAt": "2026-02-15T15:00:00.000Z"
  }
}
```

---

### Delete Open House (Protected)
**DELETE** `/open-houses/:id`

Delete an open house event. Only the listing owner can delete.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (required) - Open house ID

**Example Response (200 OK):**
```json
{
  "message": "Open house deleted successfully",
  "openHouse": {
    "_id": "65f8b3c4a1234567890abcdf",
    "listing": "65f8b3c4a1234567890abcde",
    "date": "2026-03-15"
  }
}
```

---

### Update Listing Tags (Admin Only)
**PATCH** `/listings/:id/tags`

Set or replace the tags array on a listing. The entire tags array is replaced on each call.

**Authentication:** Required (Bearer token, `admin` role)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the listing

**Request Body:**
```json
{
  "tags": ["pool", "garage", "new construction"]
}
```

**Field Requirements:**
- `tags` (required) - Array of strings; max 20 tags, each tag max 50 characters; pass `[]` to clear all tags

**Example Response (200 OK):**
```json
{
  "message": "Listing tags updated successfully",
  "listing": {
    "_id": "507f1f77bcf86cd799439011",
    "price": 250000,
    "address": "123 Main St, Huntsville, AL 35801",
    "tags": ["pool", "garage", "new construction"],
    "updatedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Admin User",
      "email": "admin@example.com",
      "phone": "2051234567"
    },
    "updatedAt": "2026-04-09T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` — `tags` is not an array, exceeds 20 items, or contains an empty/oversized tag
- `401` — No or invalid token
- `403` — Authenticated user is not an admin
- `404` — Listing not found

---

## Agent Endpoints

### Update Agent Availability (Protected)
**PUT** `/agents/me/availability`

Update the availability slots for the authenticated agent.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "availabilitySlots": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "17:00"
    },
    {
      "dayOfWeek": 2,
      "startTime": "10:00",
      "endTime": "18:00"
    }
  ]
}
```

**Field Requirements:**
- `availabilitySlots` (required) - Array of availability slot objects
- Each slot object must include:
  - `dayOfWeek` (required) - Day of week (0 = Sunday, 6 = Saturday)
  - `startTime` (required) - Start time in HH:MM format (e.g., 10:00)
  - `endTime` (required) - End time in HH:MM format (e.g., 17:30)

**Example Response (200 OK):**
```json
{
  "message": "Availability slots updated successfully",
  "agent": {
    "_id": "65f8b3c4a1234567890abce1",
    "name": "John Smith",
    "email": "john@example.com",
    "availabilitySlots": [
      {
        "dayOfWeek": 1,
        "startTime": "09:00",
        "endTime": "17:00"
      },
      {
        "dayOfWeek": 2,
        "startTime": "10:00",
        "endTime": "18:00"
      }
    ]
  }
}
```

---

### Get Agent Availability (Protected)
**GET** `/agents/me/availability`

Get the availability slots for the authenticated agent.

**Authentication:** Required (Bearer token)

**Example Response (200 OK):**
```json
{
  "availabilitySlots": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "17:00"
    },
    {
      "dayOfWeek": 2,
      "startTime": "10:00",
      "endTime": "18:00"
    }
  ]
}
```
