# Authorization Middleware Implementation

## Overview

This PR implements JWT-based authorization middleware to protect listing management endpoints. Only authenticated agents can create, update, or delete listings, while public users can still view all listings.

---

## 🔐 What Was Implemented

### Protected Routes
- ✅ **POST /api/listings** - Create listing (requires authentication)
- ✅ **PUT /api/listings/:id** - Update listing (requires authentication)
- ✅ **PATCH /api/listings/:id** - Update listing (requires authentication)
- ✅ **DELETE /api/listings/:id** - Delete listing (requires authentication)

### Public Routes
- ✅ **GET /api/listings** - View all listings (no authentication)
- ✅ **GET /api/listings/:id** - View single listing (no authentication)

### Agent Tracking
- ✅ Added `createdBy` field to Listing model (references Agent)
- ✅ Added `updatedBy` field to Listing model (references Agent)
- ✅ Automatically tracks which agent created/modified each listing

---

## 📁 Files Modified

### 1. Routes
**`server/src/routes/listingRoutes.js`**
- Imported `protect` middleware from auth module
- Applied middleware to POST, PUT, PATCH, DELETE routes
- Kept GET routes public for viewing listings

### 2. Models
**`server/src/models/Listing.js`**
- Added `createdBy` field (ObjectId reference to Agent)
- Added `updatedBy` field (ObjectId reference to Agent)
- Both fields are optional for backward compatibility

### 3. Controllers
**`server/src/controllers/listingController.js`**
- Updated `createListing` to set `createdBy` from `req.agent`
- Updated `updateListing` to set `updatedBy` from `req.agent`
- Added population of agent details in responses

---

## 🔒 How Authorization Works

### Flow Diagram

```
Client Request → Authorization Header Check → Token Validation → Agent Verification → Route Handler
     ↓                      ↓                        ↓                    ↓                ↓
POST /api/listings   Bearer <token>?        Valid JWT?          Agent exists?    Create listing
                           |                     |                    |
                           ↓                     ↓                    ↓
                      Missing/Invalid      Expired/Invalid      Not found/Inactive
                           ↓                     ↓                    ↓
                     401 Unauthorized      401 Unauthorized     401/403 Error
```

### Middleware Flow

1. **Extract Token**
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                        ↑
                   Extract this part
   ```

2. **Verify Token**
   ```javascript
   jwt.verify(token, process.env.JWT_SECRET)
   // Returns: { id: "agentId", iat: timestamp, exp: timestamp }
   ```

3. **Load Agent**
   ```javascript
   Agent.findById(decoded.id).select('-password')
   // Attaches to: req.agent
   ```

4. **Check Status**
   ```javascript
   if (!req.agent.isActive) {
     return 403 Forbidden
   }
   ```

5. **Continue**
   ```javascript
   next() // Proceeds to route handler
   ```

---

## 🧪 Testing

### Setup

1. **Seed Test Agents:**
   ```bash
   npm run seed:agents
   ```

2. **Start Server:**
   ```bash
   npm run dev
   ```

### Test Scenarios

#### ✅ Scenario 1: Login and Get Token

**Request:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YTFiMmMzZDRlNWY2ZzdoOGk5ajBrMSIsImlhdCI6MTcwNTMxNjQwMCwiZXhwIjoxNzA1OTIxMjAwfQ.xxxxx",
  "agent": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Smith",
    "email": "john@example.com"
  }
}
```

**Copy the token for next steps!**

---

#### ✅ Scenario 2: Create Listing WITH Token (Success)

**Request:**
```bash
curl -X POST http://localhost:5001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "price": 350000,
    "address": "123 Protected St, Huntsville, AL",
    "squareFeet": 2000,
    "zipCode": "35801",
    "status": "active"
  }'
```

**Response (201 Created):**
```json
{
  "message": "Listing created successfully",
  "listing": {
    "_id": "65a2b3c4d5e6f7g8h9i0j1k2",
    "price": 350000,
    "address": "123 Protected St, Huntsville, AL",
    "squareFeet": 2000,
    "zipCode": "35801",
    "status": "active",
    "createdBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Smith",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

✅ **Success!** Listing created with agent tracking.

---

#### ❌ Scenario 3: Create Listing WITHOUT Token (Unauthorized)

**Request:**
```bash
curl -X POST http://localhost:5001/api/listings \
  -H "Content-Type: application/json" \
  -d '{
    "price": 350000,
    "address": "456 Unauthorized St",
    "squareFeet": 2000,
    "zipCode": "35801"
  }'
```

**Response (401 Unauthorized):**
```json
{
  "message": "Not authorized",
  "error": "No token provided. Please include a valid token in the Authorization header."
}
```

❌ **Blocked!** No token = no access.

---

#### ❌ Scenario 4: Create Listing with INVALID Token

**Request:**
```bash
curl -X POST http://localhost:5001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid.token.here" \
  -d '{
    "price": 350000,
    "address": "789 Invalid Token Ave",
    "squareFeet": 2000,
    "zipCode": "35801"
  }'
```

**Response (401 Unauthorized):**
```json
{
  "message": "Not authorized",
  "error": "Invalid token"
}
```

❌ **Blocked!** Invalid token detected.

---

#### ❌ Scenario 5: Create Listing with EXPIRED Token

**Request:**
```bash
curl -X POST http://localhost:5001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer expired.token.here" \
  -d '{
    "price": 350000,
    "address": "999 Expired Token Rd",
    "squareFeet": 2000,
    "zipCode": "35801"
  }'
```

**Response (401 Unauthorized):**
```json
{
  "message": "Token expired",
  "error": "Your session has expired. Please log in again."
}
```

❌ **Blocked!** Token has expired (after 7 days by default).

---

#### ✅ Scenario 6: Update Listing WITH Token (Success)

**Request:**
```bash
curl -X PUT http://localhost:5001/api/listings/65a2b3c4d5e6f7g8h9i0j1k2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "price": 375000,
    "status": "pending"
  }'
```

**Response (200 OK):**
```json
{
  "message": "Listing updated successfully",
  "listing": {
    "_id": "65a2b3c4d5e6f7g8h9i0j1k2",
    "price": 375000,
    "status": "pending",
    "createdBy": {
      "name": "John Smith",
      "email": "john@example.com"
    },
    "updatedBy": {
      "name": "John Smith",
      "email": "john@example.com"
    },
    "updatedAt": "2024-01-15T11:45:00.000Z"
  }
}
```

✅ **Success!** Listing updated with agent tracking.

---

#### ✅ Scenario 7: View Listings WITHOUT Token (Public Access)

**Request:**
```bash
curl -X GET http://localhost:5001/api/listings
```

**Response (200 OK):**
```json
{
  "listings": [
    {
      "_id": "65a2b3c4d5e6f7g8h9i0j1k2",
      "price": 375000,
      "address": "123 Protected St, Huntsville, AL",
      "squareFeet": 2000,
      "zipCode": "35801",
      "status": "pending"
    }
  ],
  "count": 1
}
```

✅ **Success!** Public can view listings without authentication.

---

## 🛡️ Security Features

### 1. Token Verification
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Secret:** Loaded from `JWT_SECRET` environment variable
- **Validation:** Checks signature, expiration, and structure

### 2. Agent Verification
- Looks up agent in database by ID from token
- Returns 401 if agent not found (e.g., account deleted)
- Checks `isActive` status
- Returns 403 if account is deactivated

### 3. Error Handling
- **401 Unauthorized:** Missing, invalid, or expired token
- **403 Forbidden:** Valid token but account disabled
- **Consistent format:** Uses existing error handling utilities

### 4. Agent Tracking
- `createdBy` automatically set on listing creation
- `updatedBy` automatically set on listing updates
- Provides audit trail for all modifications

---

## 📊 Route Access Summary

| Method | Endpoint | Authentication | Purpose |
|--------|----------|----------------|---------|
| POST | `/api/listings` | ✅ Required | Create listing |
| GET | `/api/listings` | ❌ Public | View all listings |
| GET | `/api/listings/:id` | ❌ Public | View single listing |
| PUT | `/api/listings/:id` | ✅ Required | Update listing |
| PATCH | `/api/listings/:id` | ✅ Required | Update listing |
| DELETE | `/api/listings/:id` | ✅ Required | Delete listing |

---

## 🔧 Environment Variables

No additional environment variables needed - uses existing JWT configuration:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
```

---

## 💻 Frontend Integration

### React Example

```javascript
// Store token after login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (response.ok) {
    localStorage.setItem('token', data.token);
  }

  return data;
};

// Use token for protected requests
const createListing = async (listingData) => {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:5001/api/listings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Include token here
    },
    body: JSON.stringify(listingData)
  });

  return await response.json();
};

// Public requests don't need token
const getListings = async () => {
  const response = await fetch('http://localhost:5001/api/listings');
  return await response.json();
};
```

---

## 🐛 Common Errors

### 1. "No token provided"
**Cause:** Missing Authorization header
**Fix:** Include `Authorization: Bearer <token>` header

### 2. "Invalid token"
**Cause:** Malformed or tampered token
**Fix:** Login again to get a new token

### 3. "Token expired"
**Cause:** Token older than `JWT_EXPIRES_IN` (7 days default)
**Fix:** Login again to get a fresh token

### 4. "Account disabled"
**Cause:** Agent account has `isActive: false`
**Fix:** Contact admin to reactivate account

---

## 📝 Database Schema Updates

### Listing Model - New Fields

```javascript
{
  // ... existing fields ...

  createdBy: {
    type: ObjectId,
    ref: 'Agent',
    optional: true  // For backward compatibility
  },
  updatedBy: {
    type: ObjectId,
    ref: 'Agent',
    optional: true
  }
}
```

**Note:** Existing listings without `createdBy` will continue to work.

---

## ✅ Testing Checklist

- [x] Protected routes reject requests without tokens
- [x] Protected routes reject requests with invalid tokens
- [x] Protected routes reject requests with expired tokens
- [x] Protected routes accept requests with valid tokens
- [x] Public routes work without tokens
- [x] Agent information is tracked in `createdBy`
- [x] Agent information is tracked in `updatedBy`
- [x] Agent details are populated in responses
- [x] Inactive agents cannot access protected routes

---

## 🔄 What's Next

Potential future enhancements:
- Role-based authorization (admin vs regular agent)
- Agent ownership validation (only update own listings)
- Rate limiting for protected endpoints
- Token refresh mechanism
- Audit logging for all protected operations

---

## 📚 Related Documentation

- Authentication system: `AUTHENTICATION_README.md`
- API error handling: `server/API_ERROR_HANDLING.md`
- Auth endpoints: `server/AUTH_API_DOCUMENTATION.md`

---

## 🤝 Summary

✅ **All protected routes now require authentication**
✅ **Public can still view listings**
✅ **Agent tracking implemented**
✅ **Comprehensive error handling**
✅ **Ready for production**
