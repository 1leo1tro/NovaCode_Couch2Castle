# Agent Authentication System

## Overview

This PR implements a secure JWT-based authentication system for real estate agents in the Couch2Castle application. Agents can register, login, and access protected routes to manage property listings.

---

## 🎯 What Was Added

### New Features
- ✅ **Agent Registration** - Create new agent accounts with validation
- ✅ **Agent Login** - Authenticate with email/password and receive JWT token
- ✅ **Protected Routes** - Middleware to secure endpoints requiring authentication
- ✅ **Password Security** - bcrypt hashing with 10 rounds
- ✅ **JWT Tokens** - Secure token-based authentication with 7-day expiration
- ✅ **Agent Status** - Active/inactive account management
- ✅ **Error Handling** - Comprehensive validation and error responses

---

## 📁 Files Added

### Models
- **`server/src/models/Agent.js`**
  - Agent schema with email, password, name, phone, license number
  - Automatic password hashing on save (bcrypt)
  - `comparePassword()` method for login validation
  - `toPublicJSON()` method to exclude sensitive data

### Controllers
- **`server/src/controllers/authController.js`**
  - `register` - Create new agent account
  - `login` - Authenticate and return JWT token
  - `getMe` - Get current authenticated agent profile

### Routes
- **`server/src/routes/authRoutes.js`**
  - `POST /api/auth/register` - Public registration
  - `POST /api/auth/login` - Public login
  - `GET /api/auth/me` - Protected profile endpoint

### Middleware
- **`server/src/middleware/auth.js`**
  - `protect` - JWT token validation middleware
  - Extracts token from Authorization header (Bearer token)
  - Validates token and attaches agent to request object
  - Checks if agent account is active

### Scripts
- **`server/src/scripts/seedAgents.js`**
  - Seeds 4 test agents for development
  - Run with: `npm run seed:agents`

### Utilities
- **`server/src/utils/errorHandler.js`** - Centralized error response utilities
- **`server/src/utils/validators.js`** - Input validation helpers

### Documentation
- **`server/AUTH_API_DOCUMENTATION.md`** - Complete API documentation with examples

---

## 🔒 How It Works

### 1. Agent Registration Flow

```
User submits registration form
    ↓
Validate email, password, name
    ↓
Check if email already exists → 409 Conflict if duplicate
    ↓
Hash password with bcrypt (10 rounds)
    ↓
Save agent to MongoDB
    ↓
Generate JWT token (7 day expiration)
    ↓
Return token + agent data to client
```

**Request:**
```json
POST /api/auth/register
{
  "name": "John Smith",
  "email": "john@example.com",
  "password": "password123",
  "phone": "2051234567",
  "licenseNumber": "AL-RE-12345"
}
```

**Response:**
```json
{
  "message": "Agent registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "agent": {
    "id": "...",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "2051234567",
    "licenseNumber": "AL-RE-12345",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Login Flow

```
User submits email + password
    ↓
Find agent by email
    ↓
Agent not found → 401 Invalid credentials
    ↓
Compare password with bcrypt
    ↓
Password incorrect → 401 Invalid credentials
    ↓
Check if account is active
    ↓
Account inactive → 403 Account disabled
    ↓
Generate JWT token
    ↓
Return token + agent data
```

**Request:**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "agent": {
    "id": "...",
    "name": "John Smith",
    "email": "john@example.com",
    "isActive": true
  }
}
```

---

### 3. Protected Route Access

```
Client sends request with JWT token in header
    ↓
Middleware extracts token from: Authorization: Bearer <token>
    ↓
Token missing → 401 Not authorized
    ↓
Verify token with JWT_SECRET
    ↓
Token invalid/expired → 401 Invalid/expired token
    ↓
Find agent by ID from token payload
    ↓
Agent not found → 401 Not authorized
    ↓
Check if agent is active
    ↓
Agent inactive → 403 Account disabled
    ↓
Attach agent to req.agent
    ↓
Continue to route handler
```

**Request:**
```
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "agent": {
    "id": "...",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "2051234567",
    "licenseNumber": "AL-RE-12345",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🔐 Security Features

### Password Hashing
- **Algorithm:** bcrypt
- **Rounds:** 10 (provides strong security while maintaining performance)
- **Storage:** Passwords never stored in plain text
- **Retrieval:** Password field excluded from queries by default (`select: false`)

### JWT Tokens
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Secret:** Stored in environment variable `JWT_SECRET`
- **Payload:** Contains only agent ID (minimal data exposure)
- **Expiration:** 7 days (configurable via `JWT_EXPIRES_IN`)
- **Validation:** Token signature verified on every protected request

### Error Messages
- **Generic responses:** Login errors don't reveal if email exists or password is wrong
- **Same message:** "Invalid credentials" for both invalid email and wrong password
- **Prevents enumeration:** Attackers cannot determine which emails are registered

### Input Validation
- **Email format:** Validated with regex pattern
- **Password length:** Minimum 6 characters (configurable)
- **Unique constraint:** Email and license number must be unique
- **Sanitization:** Email converted to lowercase, strings trimmed

---

## 🗄️ Database Schema

### Agent Model

```javascript
{
  name: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validated: true  // Email format regex
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
    select: false,  // Never returned in queries
    hashed: true    // Auto-hashed on save
  },
  phone: {
    type: String,
    optional: true,
    validated: true  // 10-digit US phone number
  },
  licenseNumber: {
    type: String,
    optional: true,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` - Unique index for fast lookups and duplicate prevention

---

## 🧪 Testing

### Seed Test Agents

```bash
npm run seed:agents
```

Creates 4 test agents:
1. **john@example.com** / password123 - Active ✅
2. **sarah@example.com** / password123 - Active ✅
3. **mike@example.com** / password123 - Active ✅
4. **emily@example.com** / password123 - Inactive ❌

### Manual Testing with cURL

**1. Register Agent:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "email": "test@example.com",
    "password": "password123",
    "phone": "2051234567"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**3. Get Profile (replace TOKEN):**
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Environment Variables

Add to `.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
```

**⚠️ Security Notes:**
- Change `JWT_SECRET` to a random 32+ character string in production
- Never commit `.env` to version control
- Use different secrets for development and production environments

---

## 🚀 Usage Examples

### Frontend Integration (React)

**1. Login Request:**
```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (response.ok) {
    // Store token in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('agent', JSON.stringify(data.agent));
  }

  return data;
};
```

**2. Authenticated Request:**
```javascript
const getProfile = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:5001/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

**3. Logout:**
```javascript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('agent');
  // Redirect to login page
};
```

---

## 🛡️ Protecting Listing Routes

To require authentication for creating, updating, or deleting listings:

**Update `server/src/routes/listingRoutes.js`:**

```javascript
import { protect } from '../middleware/auth.js';

// Public routes (no auth required)
router.get('/listings', getAllListings);
router.get('/listings/:id', getListingById);

// Protected routes (auth required)
router.post('/listings', protect, createListing);
router.put('/listings/:id', protect, updateListing);
router.patch('/listings/:id', protect, updateListing);
router.delete('/listings/:id', protect, deleteListing);
```

**Access authenticated agent in controller:**

```javascript
export const createListing = async (req, res) => {
  // req.agent is available (set by protect middleware)
  const listing = await Listing.create({
    ...req.body,
    createdBy: req.agent.id,  // Track which agent created this
    createdByName: req.agent.name
  });

  res.status(201).json({ listing });
};
```

---

## 📊 API Endpoints Summary

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/auth/register` | POST | Public | Register new agent |
| `/api/auth/login` | POST | Public | Login and get JWT token |
| `/api/auth/me` | GET | Private | Get current agent profile |

---

## 🐛 Error Handling

All endpoints return consistent error responses:

**Structure:**
```json
{
  "message": "User-friendly error message",
  "error": "Detailed error description",
  "details": { }
}
```

**HTTP Status Codes:**
- **200** - Success
- **201** - Created (registration)
- **400** - Bad request (validation errors, missing fields)
- **401** - Unauthorized (invalid credentials, invalid/expired token)
- **403** - Forbidden (account disabled)
- **409** - Conflict (duplicate email/license)
- **500** - Server error
- **503** - Database connection error

---

## 📚 Additional Documentation

See **`server/AUTH_API_DOCUMENTATION.md`** for:
- Detailed endpoint documentation
- Complete request/response examples
- Error handling scenarios
- Postman/Thunder Client setup guide
- Security best practices

---

## 🔄 Future Enhancements

Potential additions:
- Password reset via email
- Refresh token mechanism
- Rate limiting for login attempts
- Two-factor authentication (2FA)
- Email verification for new accounts
- Role-based access control (admin vs agent)
- Session management
- OAuth integration (Google, Facebook)

---

## ✅ Checklist for Deployment

Before deploying to production:

- [ ] Change `JWT_SECRET` to strong random string (32+ characters)
- [ ] Set `JWT_EXPIRES_IN` to appropriate value for production
- [ ] Update `CLIENT_ORIGIN` CORS settings
- [ ] Use HTTPS for all API requests
- [ ] Set up proper environment variables on hosting platform
- [ ] Configure MongoDB connection string for production database
- [ ] Remove or secure test agent seed script
- [ ] Set up proper logging and monitoring
- [ ] Consider implementing rate limiting
- [ ] Add input sanitization for XSS prevention

---

## 🤝 Contributing

When making changes to authentication:
1. Update this README with any new features
2. Add tests for new functionality
3. Update API documentation
4. Follow security best practices
5. Test with seed agents before committing

---

## 📝 Notes

- Passwords are **never** stored in plain text
- Passwords are **never** returned in API responses
- JWT tokens should be stored securely on the client (HttpOnly cookies or localStorage with XSS protection)
- Always use HTTPS in production to prevent token interception
- Token expiration can be configured via `JWT_EXPIRES_IN` environment variable
