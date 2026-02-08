# Authentication API Documentation

## Overview

Secure JWT-based authentication system for real estate agents.

**Features:**
- ✅ Secure password hashing with bcrypt (10 rounds)
- ✅ JWT token authentication
- ✅ Token expiration (configurable, default 7 days)
- ✅ Protected routes middleware
- ✅ Active/inactive agent status
- ✅ Comprehensive error handling

---

## Quick Start

### 1. Seed Test Agents

```bash
npm run seed:agents
```

This creates 4 test agents:
- **john@example.com** / password123 (Active)
- **sarah@example.com** / password123 (Active)
- **mike@example.com** / password123 (Active)
- **emily@example.com** / password123 (Inactive - cannot login)

### 2. Start Server

```bash
npm run dev
```

Server runs on: `http://localhost:5001`

---

## API Endpoints

### Base URL: `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new agent |
| POST | `/login` | Public | Login and get token |
| GET | `/me` | Private | Get current agent profile |

---

## Endpoint Details

### 1. Register Agent

**POST** `/api/auth/register`

Create a new agent account.

#### Request Body:
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "password": "password123",
  "phone": "2051234567",          // Optional
  "licenseNumber": "AL-RE-12345"  // Optional
}
```

#### Success Response (201):
```json
{
  "message": "Agent registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "agent": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "2051234567",
    "licenseNumber": "AL-RE-12345",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses:

**Validation Error (400):**
```json
{
  "message": "Validation failed",
  "error": "One or more fields failed validation",
  "details": {
    "email": "Please provide a valid email address",
    "password": "Password must be at least 6 characters"
  }
}
```

**Duplicate Email (409):**
```json
{
  "message": "Agent already exists",
  "error": "An agent with this email address is already registered",
  "details": {
    "email": "john@example.com"
  }
}
```

---

### 2. Login

**POST** `/api/auth/login`

Login with email and password to receive JWT token.

#### Request Body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Success Response (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YTFiMmMzZDRlNWY2ZzdoOGk5ajBrMSIsImlhdCI6MTcwNTMxNjQwMCwiZXhwIjoxNzA1OTIxMjAwfQ.xxxxxxxxxxxxx",
  "agent": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "2051234567",
    "licenseNumber": "AL-RE-12345",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses:

**Missing Credentials (400):**
```json
{
  "message": "Missing credentials",
  "error": "Please provide both email and password"
}
```

**Invalid Credentials (401):**
```json
{
  "message": "Invalid credentials",
  "error": "The email or password you entered is incorrect"
}
```

**Account Disabled (403):**
```json
{
  "message": "Account disabled",
  "error": "This agent account has been deactivated. Please contact support."
}
```

---

### 3. Get Current Agent Profile

**GET** `/api/auth/me`

Get the profile of the currently authenticated agent.

**Authentication Required:** Yes (Bearer token)

#### Request Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200):
```json
{
  "agent": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "2051234567",
    "licenseNumber": "AL-RE-12345",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses:

**No Token (401):**
```json
{
  "message": "Not authorized",
  "error": "No token provided. Please include a valid token in the Authorization header."
}
```

**Invalid Token (401):**
```json
{
  "message": "Not authorized",
  "error": "Invalid token"
}
```

**Expired Token (401):**
```json
{
  "message": "Token expired",
  "error": "Your session has expired. Please log in again."
}
```

---

## Testing with cURL

### Register New Agent
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "email": "test@example.com",
    "password": "password123",
    "phone": "2051234567",
    "licenseNumber": "AL-RE-99999"
  }'
```

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Profile (Replace TOKEN with actual token)
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing with Thunder Client / Postman

### 1. Login Request

**Method:** POST
**URL:** `http://localhost:5001/api/auth/login`
**Headers:**
```
Content-Type: application/json
```
**Body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response:**
- Status: 200 OK
- Body: JSON with token and agent data

**Next Step:** Copy the `token` value from the response.

---

### 2. Get Profile Request

**Method:** GET
**URL:** `http://localhost:5001/api/auth/me`
**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Replace with your actual token from login response)*

**Expected Response:**
- Status: 200 OK
- Body: JSON with agent profile

---

## Environment Variables

Add to `.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
```

**Security Notes:**
- ⚠️ Change `JWT_SECRET` in production to a random 32+ character string
- ⚠️ Never commit `.env` to version control (already in `.gitignore`)
- ⚠️ Use different secrets for development and production

---

## Password Requirements

- Minimum 6 characters (configurable in Agent model)
- Automatically hashed with bcrypt before saving
- Never stored in plain text
- Never returned in API responses (select: false)

---

## Token Expiration

Default: **7 days** (configurable via `JWT_EXPIRES_IN`)

Options:
- `1h` - 1 hour
- `1d` - 1 day
- `7d` - 7 days
- `30d` - 30 days

---

## Security Features

### 1. Password Hashing
- **Algorithm:** bcrypt
- **Rounds:** 10 (good balance of security and performance)
- **Pre-save middleware:** Automatically hashes passwords before saving

### 2. JWT Tokens
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Payload:** Only agent ID (minimal data)
- **Expiration:** Configurable (default 7 days)

### 3. Protected Routes
- Middleware validates JWT on protected routes
- Checks agent exists and is active
- Attaches agent object to request (`req.agent`)

### 4. Generic Error Messages
- Login errors don't reveal if email exists
- Same message for invalid email or password
- Prevents user enumeration attacks

---

## Integration with Listings API

To protect listing endpoints (create, update, delete), add the `protect` middleware:

### Example: Protected Route

```javascript
import { protect } from '../middleware/auth.js';

// Only authenticated agents can create listings
router.post('/listings', protect, createListing);

// Only authenticated agents can update listings
router.put('/listings/:id', protect, updateListing);

// Only authenticated agents can delete listings
router.delete('/listings/:id', protect, deleteListing);

// Public can view listings (no auth required)
router.get('/listings', getAllListings);
router.get('/listings/:id', getListingById);
```

In the controller, access the authenticated agent:

```javascript
export const createListing = async (req, res) => {
  // req.agent is available (set by protect middleware)
  const agentId = req.agent.id;
  const agentName = req.agent.name;

  // Create listing with agent info
  const listing = await Listing.create({
    ...req.body,
    createdBy: agentId
  });

  // ...
};
```

---

## Error Handling

All authentication endpoints use the existing error handling utilities:

- **400** - Validation errors, missing fields
- **401** - Invalid credentials, invalid/expired token
- **403** - Account disabled
- **409** - Duplicate email
- **500** - Server errors
- **503** - Database connection errors

Consistent error response format:
```json
{
  "message": "User-friendly error message",
  "error": "Detailed error description",
  "details": { }
}
```

---

## Database Schema

### Agent Model

```javascript
{
  name: String (required, 2-100 chars),
  email: String (required, unique, valid email),
  password: String (required, min 6 chars, hashed, select: false),
  phone: String (optional, 10 digits),
  licenseNumber: String (optional, unique),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Methods:**
- `comparePassword(candidatePassword)` - Compare password for login
- `toPublicJSON()` - Return agent data without sensitive fields

---

## Next Steps

1. ✅ Test authentication with seeded agents
2. ✅ Protect listing create/update/delete routes
3. ✅ Add agent relationship to listings (createdBy field)
4. ⬜ Add password reset functionality
5. ⬜ Add refresh token mechanism
6. ⬜ Add rate limiting for login attempts
7. ⬜ Add email verification

---

## Support

For issues or questions, refer to:
- Error handling: `server/API_ERROR_HANDLING.md`
- Listings API: `server/API_ERROR_HANDLING.md`
