# Couch2Castle

A MERN stack real estate listing application.

## Getting Started

### Installation

1. Install root dependencies:
```bash
npm install
```

2. Install client dependencies:
```bash
cd client && npm install && cd ..
```

3. Install server dependencies:
```bash
cd server && npm install && cd ..
```

3. Set up environment:
   - Copy `server/.env.example` to `server/.env`
   - Set `MONGO_URI` to your MongoDB connection string

### Running the Project

**Run both frontend and backend simultaneously using `concurrently`:**
```bash
npm run dev
```

This command starts:
- Frontend on port 5173 (React/Vite)
- Backend on port 5001 (Node.js/Express)

**Run individually:**
```bash
npm run dev:client    # Frontend only (port 5173)
npm run dev:server    # Backend only (port 5001)
```

### Seeding the Database

Populate the database with 25 diverse test listings:

```bash
cd server
npm run seed
```

The seed script clears existing listings and inserts records covering:
- Price range: $0 - $5,000,000
- Square footage: 0 - 10,000 sqft
- 11 unique ZIP codes (including ZIP+4 format)
- All statuses: active, pending, sold, inactive

See [server/src/scripts/seedListings.js](server/src/scripts/seedListings.js) for the full dataset.

## Tech Stack

- **Frontend**: React (Vite), React Router, Axios
- **Backend**: Node.js, Express, Mongoose, CORS
- **Database**: MongoDB (Atlas or local)
- **Testing**: Jest, Supertest, MongoDB Memory Server

## API Documentation

For detailed API documentation, see:
- [API Endpoints](server/API.md) - Comprehensive endpoint descriptions and usage examples.
- [Authentication API](server/AUTH_API_DOCUMENTATION.md) - Sign up, login, logout, and token management.
- [Showings API](server/GET_SHOWINGS_ENDPOINT.md) - Schedule and manage viewings.

## API Endpoints

| Method | Route               | Auth     | Description                          |
|--------|---------------------|----------|--------------------------------------|
| POST   | `/api/listings`     | Required | Create a new listing                 |
| GET    | `/api/listings`     | Public   | Get all listings (supports filters)  |
| GET    | `/api/listings/:id` | Public   | Get a single listing by ID           |
| PUT    | `/api/listings/:id` | Required | Update an existing listing           |
| PATCH  | `/api/listings/:id` | Required | Partially update an existing listing |
| DELETE | `/api/listings/:id` | Required | Delete a listing                     |

**Query parameters for `GET /api/listings`:**
- `keyword` - case-insensitive search across address, ZIP code, and status
- `minPrice` - minimum price filter
- `maxPrice` - maximum price filter
- `minSquareFeet` - minimum square footage filter
- `maxSquareFeet` - maximum square footage filter
- `zipCode` - filter by ZIP code
- `status` - filter by status (`active`, `pending`, `sold`, `inactive`); defaults to `active`
- `page` - page number for pagination (default: 1)
- `limit` - results per page (default: 10, max: 100)
- `sortBy` - sort field (`price`, `squareFeet`, `createdAt`, `updatedAt`)
- `order` - sort direction (`asc`, `desc`)

## Authentication

To manage user accounts and access protected routes:

| Method | Route               | Auth     | Description                          |
|--------|---------------------|----------|--------------------------------------|
| POST   | `/api/auth/signup`  | Public   | Register a new account                |
| POST   | `/api/auth/login`    | Public   | Log in and receive an auth token      |
| POST   | `/api/auth/logout`   | Required | Log out and clear the auth token      |
| GET    | `/api/auth/me`       | Required | Get current user data                 |

## Showings

Manage viewings for properties:

| Method | Route               | Auth     | Description                          |
|--------|---------------------|----------|--------------------------------------|
| POST   | `/api/showings`      | Required | Schedule a new viewing                |
| GET    | `/api/showings`      | Public   | Get all scheduled viewings           |
| GET    | `/api/showings/:id`  | Public   | Get details for a specific viewing    |
| PUT    | `/api/showings/:id`  | Required | Update an existing viewing           |
| DELETE | `/api/showings/:id`  | Required | Cancel a viewing                     |

## Notifications

View and manage alerts and messages:

| Method | Route               | Auth     | Description                          |
|--------|---------------------|----------|--------------------------------------|
| GET    | `/api/notifications` | Public   | Get all notifications                |
| POST   | `/api/notifications/read` | Required | Mark a notification as read          |

## Frontend Routing

Key pages in the application:
- `/listings`: View and search for properties.
- `/showings`: Schedule or manage viewings.
- `/contacts`: Communicate with agents or clients.
- `/help`: Access support resources.
- `/signin` and `/signup`: Authenticate as a user.

## Testing

Tests use an in-memory MongoDB instance, so no external database is required.

```bash
cd server
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

See [TestingREADME.md](TestingREADME.md) for detailed test documentation.

## Ports

- Client: `http://localhost:5173`
- Server: `http://localhost:5001`

## Project Structure

```
NovaCode_Couch2Castle/
├── client/                          # React frontend (Vite)
├── server/
│   ├── src/
│   │   ├── config/db.js             # MongoDB connection
│   │   ├── controllers/             # Route handlers
│   │   ├── models/Listing.js        # Mongoose schema
│   │   ├── routes/listingRoutes.js  # API routes
│   │   ├── scripts/seedListings.js  # Database seed script
│   │   ├── tests/                   # Jest test suites
│   │   ├── app.js                   # Express app setup
│   │   └── server.js                # Entry point
│   ├── .env.example                 # Environment template
│   └── package.json
└── package.json                     # Root (concurrently)
```
