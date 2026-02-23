# GET /api/showings Endpoint Documentation

## Overview
Retrieve all showing requests associated with an authenticated agent's listings with optional filtering and pagination.

## Endpoint Details
- **Route**: `GET /api/showings`
- **Authentication**: Required (Bearer token)
- **Authorization**: Agent-only (must be authenticated agent)

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `listingId` | string (ObjectId) | No | Filter by specific listing. Agent must own the listing. |
| `status` | string | No | Filter by showing status. Valid values: `pending`, `confirmed`, `completed`, `cancelled` |
| `page` | number | No | Page number (default: 1, min: 1) |
| `limit` | number | No | Results per page (default: 10, min: 1, max: 100) |

## Request Example

```bash
# Get all showings for authenticated agent
curl -X GET "http://localhost:5000/api/showings" \
  -H "Authorization: Bearer <token>"

# Get pending showings only
curl -X GET "http://localhost:5000/api/showings?status=pending" \
  -H "Authorization: Bearer <token>"

# Get confirmed showings with pagination
curl -X GET "http://localhost:5000/api/showings?status=confirmed&page=1&limit=20" \
  -H "Authorization: Bearer <token>"

# Get showings for a specific listing
curl -X GET "http://localhost:5000/api/showings?listingId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <token>"
```

## Response Format

### Success Response (200 OK)

```json
{
  "showings": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "listing": {
        "_id": "507f1f77bcf86cd799439011",
        "address": "123 Main St",
        "zipCode": "12345",
        "price": 450000,
        "images": ["image1.jpg"],
        "createdBy": {
          "_id": "507f1f77bcf86cd799439010",
          "name": "John Agent",
          "email": "john@example.com",
          "phone": "555-0100"
        }
      },
      "name": "Jane Buyer",
      "email": "jane@example.com",
      "phone": "555-0101",
      "preferredDate": "2024-03-15T14:00:00Z",
      "message": "Very interested in this property",
      "status": "pending",
      "feedback": "",
      "createdAt": "2024-03-01T10:30:00Z",
      "updatedAt": "2024-03-01T10:30:00Z"
    }
  ],
  "count": 15,
  "page": 1,
  "totalPages": 2
}
```

### Empty Results Response (200 OK)

```json
{
  "showings": [],
  "count": 0,
  "page": 1,
  "totalPages": 0,
  "message": "No showing requests found"
}
```

## Error Responses

### 401 Unauthorized - No token provided
```json
{
  "error": "Not authorized",
  "message": "No token provided. Please include a valid token in the Authorization header."
}
```

### 401 Unauthorized - Invalid token
```json
{
  "error": "Not authorized",
  "message": "Invalid token"
}
```

### 403 Forbidden - Agent account disabled
```json
{
  "error": "Account disabled",
  "message": "This agent account has been deactivated"
}
```

### 400 Bad Request - Invalid listing ID
```json
{
  "error": "Invalid ObjectId",
  "message": "Invalid listing ID format"
}
```

### 403 Forbidden - Unauthorized listing access
```json
{
  "error": "Access denied",
  "message": "You can only view showings for your own listings"
}
```

### 400 Bad Request - Invalid status filter
```json
{
  "error": "Invalid status",
  "message": "Status must be one of: pending, confirmed, completed, cancelled"
}
```

### 400 Bad Request - Invalid pagination
```json
{
  "error": "Invalid pagination",
  "message": "Page must be >= 1 and limit must be between 1 and 100"
}
```

### 503 Service Unavailable - Database connection error
```json
{
  "error": "Database connection error",
  "message": "Unable to connect to database. Please try again later."
}
```

## Implementation Details

### Authorization Logic
- Only authenticated agents can access this endpoint
- Agents can only view showings for listings they created
- If a specific `listingId` is provided, the agent must own that listing
- If no `listingId` is provided, all showings for all agent-owned listings are returned

### Filtering
- **Listing Filter**: If `listingId` is provided, only showings for that listing are returned
- **Status Filter**: If `status` is provided, only showings with that status are returned
- Filters can be combined (e.g., pending showings for a specific listing)

### Pagination
- Default page: 1
- Default limit: 10
- Maximum limit: 100
- Returns `totalPages` calculated as `Math.ceil(count / limit)`

### Sorting
- Results are sorted by creation date in descending order (newest first)

### Data Population
Each showing result includes:
- All showing request details (name, email, phone, preferredDate, message, status, feedback)
- Full listing information (address, zipCode, price, images)
- Agent information (name, email, phone)

## Status Values

The showing status field can have the following values:

| Status | Description |
|--------|-------------|
| `pending` | Initial showing request, awaiting agent response |
| `confirmed` | Agent has confirmed the showing appointment |
| `completed` | The showing has been completed |
| `cancelled` | The showing request was cancelled |

## Notes

- The endpoint uses Bearer token authentication in the `Authorization` header
- Token validation happens automatically via the `protect` middleware
- All showing data is automatically sorted by most recent first
- Pagination metadata is always included in the response for easier frontend integration
- If an agent has no listings, an empty array with `count: 0` is returned
