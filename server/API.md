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

### Create Listing
**POST** `/listings`

Creates a new property listing.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "price": 250000,
  "address": "123 Main St, Huntsville, AL",
  "description": "Charming 3-bedroom home",
  "squareFeet": 1500,
  "zipCode": "35801",
  "status": "active",
  "images": ["https://example.com/image1.jpg"]
}
```

**Required fields:** `price`, `address`, `squareFeet`, `zipCode`

**Example Response (201):**
```json
{
  "message": "Listing created successfully",
  "listing": {
    "_id": "507f1f77bcf86cd799439011",
    "price": 250000,
    "address": "123 Main St, Huntsville, AL",
    "squareFeet": 1500,
    "status": "active",
    "zipCode": "35801",
    "images": ["https://example.com/image1.jpg"],
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

---

### Update Listing
**PUT** `/listings/:id` | **PATCH** `/listings/:id`

Updates an existing listing. Both `PUT` and `PATCH` are supported.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the listing

**Request Body:** Any subset of listing fields to update.

**Example Response (200):**
```json
{
  "message": "Listing updated successfully",
  "listing": {
    "_id": "507f1f77bcf86cd799439011",
    "price": 275000,
    "status": "pending",
    "updatedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Smith"
    },
    "updatedAt": "2024-01-15T12:45:00.000Z"
  }
}
```

---

### Delete Listing
**DELETE** `/listings/:id`

Deletes a listing by ID.

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the listing

**Example Response (200):**
```json
{
  "message": "Listing deleted successfully",
  "listing": {
    "_id": "507f1f77bcf86cd799439011",
    "price": 250000,
    "address": "123 Main St, Huntsville, AL 35801",
    "status": "active"
  }
}
```

**Error Response (404):**
```json
{
  "message": "Listing not found",
  "error": "No listing exists with ID: 507f1f77bcf86cd799439011"
}
```
