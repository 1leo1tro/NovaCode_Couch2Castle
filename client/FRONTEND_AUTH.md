# Frontend Authentication Implementation

## Overview
This document describes the frontend authentication implementation for the Couch2Castle real estate application. The system implements JWT-based authentication with React Context API for state management.

## Components Implemented

### 1. AuthContext (`client/src/context/AuthContext.jsx`)
Central authentication state management using React Context API.

**Features:**
- JWT token storage in `localStorage`
- User state management
- Automatic token persistence across page reloads
- Axios default Authorization header configuration
- Login, logout, and authentication check functions

**Methods:**
- `login(email, password)` - Authenticates user and stores token
- `logout()` - Clears user session and token
- `isAuthenticated()` - Checks if user is currently authenticated
- `user` - Current user object
- `token` - Current JWT token
- `loading` - Loading state during initialization

**Usage:**
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (isAuthenticated()) {
    return <div>Welcome, {user.name}!</div>;
  }
  return <div>Please sign in</div>;
}
```

### 2. ProtectedRoute Component (`client/src/components/ProtectedRoute.jsx`)
Wrapper component for routes that require authentication.

**Features:**
- Redirects unauthenticated users to `/signin`
- Shows loading state while checking authentication
- Preserves route location for redirect after login

**Usage:**
```javascript
import ProtectedRoute from './components/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### 3. Updated SignIn Page (`client/src/pages/SignIn.jsx`)
Enhanced with functional authentication.

**Features:**
- Integrates with AuthContext for login
- Form validation and error handling
- Loading states during authentication
- Redirects to `/listings` after successful login
- User type selection (Agent/Regular User)
- Note: Only Agent login is currently functional

**Test Credentials (from seed data):**
- Email: `john@example.com` | Password: `password123`
- Email: `sarah@example.com` | Password: `password123`
- Email: `mike@example.com` | Password: `password123`

### 4. Updated Navbar (`client/src/components/Navbar.jsx`)
Authentication-aware navigation.

**Features:**
- Shows "Sign in" button for guests
- Shows user name and "Sign out" button for authenticated users
- Handles logout and redirects to home page

### 5. Updated Listings Page (`client/src/pages/Listings.jsx`)
Public viewing with agent-only management features.

**Features:**
- Fetches listings from backend API (`GET /api/listings`)
- Public viewing for all users
- Agent-only UI elements:
  - "Create Listing" button (links to `/listings/create`)
  - "Edit" button on each listing (links to `/listings/edit/:id`)
  - "Delete" button on each listing (confirms before deletion)
- Filter by price and ZIP code
- Real-time deletion with confirmation

### 6. Updated PropertyDetails Page (`client/src/pages/PropertyDetails.jsx`)
Property details with agent management options.

**Features:**
- Fetches property from backend API (`GET /api/listings/:id`)
- Public viewing for all users
- Agent-only UI elements:
  - "Edit Listing" button (links to `/listings/edit/:id`)
  - "Delete Listing" button (confirms and redirects to `/listings`)
- Displays created by agent information
- Image gallery with fallback for properties without images

## API Integration

### Backend Endpoints Used
- `POST /api/auth/login` - Agent login
- `GET /api/listings` - Fetch all listings (public)
- `GET /api/listings/:id` - Fetch single listing (public)
- `DELETE /api/listings/:id` - Delete listing (protected)

### Axios Configuration
The AuthContext automatically sets the Authorization header for all axios requests:
```javascript
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

## Authentication Flow

1. **User visits site** → Check localStorage for token
2. **Token exists** → Validate and load user data
3. **User clicks "Sign in"** → Navigate to `/signin`
4. **User selects Agent** → Show login form
5. **User submits credentials** → POST to `/api/auth/login`
6. **Login successful** → Store token and user in localStorage, set axios header, redirect to `/listings`
7. **User navigates** → Protected UI elements shown/hidden based on `isAuthenticated()`
8. **User clicks "Sign out"** → Clear token and user, delete axios header, redirect to `/`

## Security Features

- JWT tokens stored in localStorage (persists across sessions)
- Automatic token inclusion in API requests via axios defaults
- Backend validates tokens on protected routes
- Token expiration handled by backend (returns 401)
- Agent account status checked (inactive accounts rejected)
- UI elements hidden from non-authenticated users (client-side only, backend enforces actual protection)

## Future Enhancements

### Recommended Next Steps:
1. **Agent Dashboard** - Create dedicated dashboard page with analytics
2. **Token Refresh** - Implement automatic token refresh before expiration
3. **Error Boundaries** - Add React error boundaries for better error handling
4. **Loading States** - Improve loading states with skeleton screens
5. **Regular User Auth** - Implement authentication for regular users
6. **Favorite Listings** - Allow users to save favorite properties
7. **Tour Scheduling** - Make tour scheduling form functional

### Security Improvements:
1. Move to httpOnly cookies instead of localStorage (prevents XSS attacks)
2. Implement CSRF protection
3. Add rate limiting on login attempts
4. Implement 2FA for agent accounts
5. Add activity logging for agent actions

## Testing

### Manual Testing Steps:
1. **Test public access:**
   - Visit `/listings` without signing in
   - View property details
   - Verify Create/Edit/Delete buttons are NOT visible

2. **Test agent login:**
   - Click "Sign in" → Select "Agent"
   - Enter credentials: `john@example.com` / `password123`
   - Verify redirect to `/listings`
   - Verify name appears in navbar
   - Verify Create/Edit/Delete buttons ARE visible

3. **Test agent management:**
   - Click "Create Listing" → Verify navigation to `/listings/create`
   - Click "Edit" on a listing → Verify navigation to `/listings/edit/:id`
   - Click "Delete" on a listing → Verify confirmation and deletion

4. **Test logout:**
   - Click "Sign out" in navbar
   - Verify redirect to home page
   - Verify "Sign in" button returns
   - Verify Create/Edit/Delete buttons disappear

## Troubleshooting

### Common Issues:

**"Network Error" when logging in:**
- Ensure backend server is running on `http://localhost:5001`
- Check `.env` file has correct `MONGO_URI` and `JWT_SECRET`
- Verify MongoDB is running

**Token not persisting after page reload:**
- Check browser's localStorage in DevTools
- Ensure AuthProvider wraps the entire app in App.jsx

**Create/Edit/Delete buttons not showing for authenticated agents:**
- Check `isAuthenticated()` is returning true
- Verify token is present in localStorage
- Check browser console for errors

**"Not authorized" errors:**
- Check token hasn't expired (default: 7 days)
- Verify agent account is active (`isActive: true`)
- Try logging out and back in
