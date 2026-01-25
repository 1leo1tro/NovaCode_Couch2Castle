# Couch2Castle API Documentation

Base URL: `http://localhost:5000/api`

## Listings Endpoints

### Get All Listings
**GET** `/listings`

Returns all active property listings.

**Query Parameters:**
- `minPrice` (optional) - Filter by minimum price
- `maxPrice` (optional) - Filter by maximum price  
- `zipCode` (optional) - Filter by ZIP code in address

**Example Request:**
```
GET /api/listings?minPrice=200000&maxPrice=300000
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