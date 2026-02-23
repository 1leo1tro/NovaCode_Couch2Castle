# Couch2Castle API Documentation

Base URL: `http://localhost:5000/api`

## Listings Endpoints

### Get All Listings
**GET** `/listings`

Returns all active property listings.

**Query Parameters:**
- `keyword` (optional) - Search in address, ZIP code, and status (case-insensitive)
- `minPrice` (optional) - Filter by minimum price
- `maxPrice` (optional) - Filter by maximum price  
- `zipCode` (optional) - Filter by ZIP code

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
      "id": 1,
      "price": 250000,
      "address": "123 Main St, Huntsville, AL 35801",
      "squareFeet": 1500,
      "thumbnail": "https://via.placeholder.com/300",
      "status": "active"
    }
  ],
  "count": 1
}
```

---

### Get Listing by ID
**GET** `/listings/:id`

Returns a single listing by ID.

**URL Parameters:**
- `id` (required) - Listing ID

**Example Request:**
```
GET /api/listings/1
```

**Example Response:**
```json
{
  "listing": {
    "id": 1,
    "price": 250000,
    "address": "123 Main St, Huntsville, AL 35801",
    "squareFeet": 1500,
    "thumbnail": "https://via.placeholder.com/300",
    "status": "active"
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