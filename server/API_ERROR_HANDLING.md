# Listings API - Error Handling Documentation

## Overview
This API implements comprehensive error handling with:
- ✅ Proper HTTP status codes (400, 404, 409, 422, 500, 503)
- ✅ Consistent JSON error response structure
- ✅ Input validation for all endpoints
- ✅ Detailed error messages without exposing sensitive information

---

## Error Response Structure

All errors follow this consistent format:

```json
{
  "message": "User-friendly error description",
  "error": "Detailed error message",
  "details": {
    "field": "Additional context (optional)"
  }
}
```

---

## API Endpoints

### 1. GET /api/listings

**Description:** Get all listings with filtering, pagination, and sorting

#### Query Parameters:
| Parameter | Type | Validation | Example |
|-----------|------|------------|---------|
| minPrice | number | >= 0 | `?minPrice=200000` |
| maxPrice | number | >= 0 | `?maxPrice=500000` |
| minSquareFeet | number | >= 0 | `?minSquareFeet=1500` |
| maxSquareFeet | number | >= 0 | `?maxSquareFeet=3000` |
| zipCode | string | 5 digits | `?zipCode=35801` |
| status | string | active, pending, sold, inactive | `?status=active` |
| page | number | 1-10000 | `?page=2` |
| limit | number | 1-100 | `?limit=20` |
| sortBy | string | price, squareFeet, createdAt, updatedAt | `?sortBy=price` |
| order | string | asc, desc, 1, -1 | `?order=desc` |

#### Success Response (200):
```json
{
  "listings": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "price": 250000,
      "address": "123 Main St, Huntsville, AL",
      "squareFeet": 1500,
      "status": "active",
      "zipCode": "35801",
      "images": [],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 25
}
```

#### Error Examples:

**Invalid minPrice (400):**
```bash
GET /api/listings?minPrice=invalid
```
```json
{
  "message": "Invalid query parameter",
  "error": "minPrice must be a valid number",
  "details": {
    "parameter": "minPrice",
    "value": "invalid"
  }
}
```

**Negative price (400):**
```bash
GET /api/listings?minPrice=-1000
```
```json
{
  "message": "Invalid query parameter",
  "error": "minPrice must be at least 0",
  "details": {
    "parameter": "minPrice",
    "value": "-1000"
  }
}
```

**Invalid price range (400):**
```bash
GET /api/listings?minPrice=500000&maxPrice=200000
```
```json
{
  "message": "Invalid query parameters",
  "error": "minPrice cannot be greater than maxPrice",
  "minPrice": 500000,
  "maxPrice": 200000
}
```

**Invalid ZIP code (400):**
```bash
GET /api/listings?zipCode=invalid
```
```json
{
  "message": "Invalid query parameter",
  "error": "zipCode must be a 5-digit number",
  "details": {
    "parameter": "zipCode",
    "value": "invalid"
  }
}
```

**Invalid status (400):**
```bash
GET /api/listings?status=unknown
```
```json
{
  "message": "Invalid query parameter",
  "error": "status must be one of: active, pending, sold, inactive",
  "details": {
    "parameter": "status",
    "value": "unknown"
  }
}
```

**Invalid page number (400):**
```bash
GET /api/listings?page=0
```
```json
{
  "message": "Invalid query parameter",
  "error": "page must be at least 1",
  "details": {
    "parameter": "page",
    "value": "0"
  }
}
```

**Page limit too high (400):**
```bash
GET /api/listings?limit=500
```
```json
{
  "message": "Invalid query parameter",
  "error": "limit must not exceed 100",
  "details": {
    "parameter": "limit",
    "value": "500"
  }
}
```

**Invalid sortBy field (400):**
```bash
GET /api/listings?sortBy=invalidField
```
```json
{
  "message": "Invalid query parameter",
  "error": "sortBy must be one of: price, squareFeet, createdAt, updatedAt",
  "details": {
    "parameter": "sortBy",
    "value": "invalidField"
  }
}
```

---

### 2. GET /api/listings/:id

**Description:** Get a single listing by ID

#### Success Response (200):
```json
{
  "listing": {
    "_id": "507f1f77bcf86cd799439011",
    "price": 250000,
    "address": "123 Main St, Huntsville, AL",
    "squareFeet": 1500,
    "status": "active",
    "zipCode": "35801",
    "images": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Examples:

**Invalid ID format (400):**
```bash
GET /api/listings/invalid-id
```
```json
{
  "message": "Invalid ID format",
  "error": "The provided ID is not a valid MongoDB ObjectId",
  "id": "invalid-id",
  "expectedFormat": "24 hexadecimal characters"
}
```

**Listing not found (404):**
```bash
GET /api/listings/507f1f77bcf86cd799439011
```
```json
{
  "message": "Listing not found",
  "error": "No listing exists with ID: 507f1f77bcf86cd799439011",
  "details": {
    "id": "507f1f77bcf86cd799439011"
  }
}
```

---

### 3. POST /api/listings

**Description:** Create a new listing

#### Request Body:
```json
{
  "price": 250000,
  "address": "123 Main St, Huntsville, AL",
  "squareFeet": 1500,
  "status": "active",
  "zipCode": "35801",
  "images": ["https://example.com/image1.jpg"]
}
```

#### Success Response (201):
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
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Examples:

**Missing required field (400):**
```bash
POST /api/listings
{
  "address": "123 Main St"
}
```
```json
{
  "message": "Validation failed",
  "error": "One or more fields failed validation",
  "details": {
    "price": "Price is required",
    "squareFeet": "Square footage is required",
    "zipCode": "ZIP code is required"
  }
}
```

**Invalid data type (400):**
```bash
POST /api/listings
{
  "price": "not-a-number",
  "address": "123 Main St",
  "squareFeet": 1500,
  "zipCode": "35801"
}
```
```json
{
  "message": "Validation failed",
  "error": "One or more fields failed validation",
  "details": {
    "price": "Cast to Number failed for value \"not-a-number\" at path \"price\""
  }
}
```

**Negative price (400):**
```bash
POST /api/listings
{
  "price": -100,
  "address": "123 Main St",
  "squareFeet": 1500,
  "zipCode": "35801"
}
```
```json
{
  "message": "Validation failed",
  "error": "One or more fields failed validation",
  "details": {
    "price": "Price must be a positive number"
  }
}
```

**Invalid status (400):**
```bash
POST /api/listings
{
  "price": 250000,
  "address": "123 Main St",
  "squareFeet": 1500,
  "status": "invalid-status",
  "zipCode": "35801"
}
```
```json
{
  "message": "Validation failed",
  "error": "One or more fields failed validation",
  "details": {
    "status": "Status must be one of: active, pending, sold, inactive"
  }
}
```

**Invalid ZIP code format (400):**
```bash
POST /api/listings
{
  "price": 250000,
  "address": "123 Main St",
  "squareFeet": 1500,
  "zipCode": "invalid"
}
```
```json
{
  "message": "Validation failed",
  "error": "One or more fields failed validation",
  "details": {
    "zipCode": "ZIP code must be a valid US ZIP code format (e.g., 35801 or 35801-1234)"
  }
}
```

---

### 4. PUT/PATCH /api/listings/:id

**Description:** Update an existing listing (supports both PUT and PATCH)

#### Request Body:
```json
{
  "price": 275000,
  "status": "pending"
}
```

#### Success Response (200):
```json
{
  "message": "Listing updated successfully",
  "listing": {
    "_id": "507f1f77bcf86cd799439011",
    "price": 275000,
    "address": "123 Main St, Huntsville, AL",
    "squareFeet": 1500,
    "status": "pending",
    "zipCode": "35801",
    "images": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:45:00.000Z"
  }
}
```

#### Error Examples:

**Invalid ID format (400):**
```bash
PUT /api/listings/invalid-id
```
```json
{
  "message": "Invalid ID format",
  "error": "The provided ID is not a valid MongoDB ObjectId",
  "id": "invalid-id",
  "expectedFormat": "24 hexadecimal characters"
}
```

**Empty request body (400):**
```bash
PUT /api/listings/507f1f77bcf86cd799439011
{}
```
```json
{
  "message": "Empty request body",
  "error": "Request body must contain at least one field to update"
}
```

**Validation error (400):**
```bash
PUT /api/listings/507f1f77bcf86cd799439011
{
  "price": -5000
}
```
```json
{
  "message": "Validation failed",
  "error": "One or more fields failed validation",
  "details": {
    "price": "Price must be a positive number"
  }
}
```

**Listing not found (404):**
```bash
PUT /api/listings/507f1f77bcf86cd799439011
{
  "price": 300000
}
```
```json
{
  "message": "Listing not found",
  "error": "No listing exists with ID: 507f1f77bcf86cd799439011",
  "details": {
    "id": "507f1f77bcf86cd799439011"
  }
}
```

---

### 5. DELETE /api/listings/:id

**Description:** Delete a listing by ID

#### Success Response (200):
```json
{
  "message": "Listing deleted successfully",
  "listing": {
    "_id": "507f1f77bcf86cd799439011",
    "price": 250000,
    "address": "123 Main St, Huntsville, AL",
    "squareFeet": 1500,
    "status": "active",
    "zipCode": "35801",
    "images": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Examples:

**Invalid ID format (400):**
```bash
DELETE /api/listings/12345
```
```json
{
  "message": "Invalid ID format",
  "error": "The provided ID is not a valid MongoDB ObjectId",
  "id": "12345",
  "expectedFormat": "24 hexadecimal characters"
}
```

**Listing not found (404):**
```bash
DELETE /api/listings/507f1f77bcf86cd799439011
```
```json
{
  "message": "Listing not found",
  "error": "No listing exists with ID: 507f1f77bcf86cd799439011",
  "details": {
    "id": "507f1f77bcf86cd799439011"
  }
}
```

---

## Database Connection Errors (503)

**All endpoints handle database connection errors:**

```json
{
  "message": "Database connection error",
  "error": "Unable to connect to the database. Please try again later.",
  "details": {
    "type": "DATABASE_CONNECTION_ERROR"
  }
}
```

---

## Generic Server Errors (500)

**Unexpected errors are handled gracefully:**

```json
{
  "message": "Error fetching listings",
  "error": "Detailed error message (safe for display)",
  "details": {
    "type": "ErrorType"
  }
}
```

---

## HTTP Status Code Summary

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid parameters, validation errors, malformed requests |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate key error |
| 500 | Internal Server Error | Unexpected server errors |
| 503 | Service Unavailable | Database connection errors |

---

## Testing Examples

### Using cURL:

```bash
# Get all listings with filters
curl "http://localhost:5001/api/listings?minPrice=200000&maxPrice=500000&status=active&page=1&limit=10"

# Get single listing
curl "http://localhost:5001/api/listings/507f1f77bcf86cd799439011"

# Create listing
curl -X POST "http://localhost:5001/api/listings" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 250000,
    "address": "123 Main St, Huntsville, AL",
    "squareFeet": 1500,
    "status": "active",
    "zipCode": "35801"
  }'

# Update listing
curl -X PUT "http://localhost:5001/api/listings/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 275000,
    "status": "pending"
  }'

# Delete listing
curl -X DELETE "http://localhost:5001/api/listings/507f1f77bcf86cd799439011"

# Test error: Invalid ID
curl "http://localhost:5001/api/listings/invalid-id"

# Test error: Invalid price
curl "http://localhost:5001/api/listings?minPrice=invalid"
```

---

## Summary

✅ **Complete error handling coverage:**
- Invalid listing IDs (400)
- Malformed query parameters (400)
- Validation errors (400)
- Duplicate entries (409)
- Not found (404)
- Database errors (503)
- Server errors (500)

✅ **Consistent error response format**
✅ **No sensitive information exposed**
✅ **Clear, actionable error messages**
✅ **Comprehensive input validation**
