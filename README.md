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

Run all three seed scripts in order to populate agents, listings, and showings with realistic data:

```bash
cd server
npm run seed:agents    # 7 agents across AL, TN, GA markets
npm run seed           # 45 listings across 5 US cities
npm run seed:showings  # 32 showings spread across past and future dates
```

Each script clears its collection before inserting. Run them in the order above — listings reference agents, and showings reference both.

**What gets seeded:**

| Script | Records | Details |
|--------|---------|---------|
| `seed:agents` | 7 agents | 5 active + 1 manager + 1 inactive; AL-RE/TN-RE/GA-RE license numbers; availability slots |
| `seed` | 45 listings | Huntsville AL, Nashville TN, Atlanta GA, Austin TX, Denver CO; $112k–$1.45M; 22 active, 8 pending, 10 sold, 5 inactive |
| `seed:showings` | 32 showings | 15 pending, 6 confirmed, 8 completed (with feedback), 3 cancelled; dates from 35 days past to 21 days future |

Sold listings include `closingDate` and `finalSalePrice`. Agents are assigned to listings via round-robin. Notifications are auto-created for pending/confirmed showings.

**Test login:** `margaret.holloway@novarealty.com` / `password123`

See [server/src/scripts/](server/src/scripts/) for the full datasets.

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
npm test              # Run all tests (7 suites, 269 tests)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Test suites:**

| File | What it covers |
|------|----------------|
| `listings.test.js` | CRUD, filters (price, sqft, ZIP, status, keyword), pagination, ownership enforcement, tags |
| `showings.test.js` | Create/read/update/delete showings, status filtering, ownership, pagination |
| `notifications.test.js` | Notification creation on showing request, fetch, unread count, mark-as-read |
| `agentAvailability.test.js` | GET/PUT availability slots, validation |
| `openHouses.test.js` | Open house CRUD and authorization |
| `reports.test.js` | Role-based access control for report endpoints |
| `seedData.test.js` | Model validation for seed data: multi-market listings, sold fields, tags, agents (roles/slots/license), showings (past-date bypass, feedback), notifications |

## Ports

- Client: `http://localhost:5173`
- Server: `http://localhost:5001`

## Project Structure

```
NovaCode_Couch2Castle/
├── client/                              # React frontend (Vite)
├── server/
│   ├── src/
│   │   ├── config/db.js                 # MongoDB connection
│   │   ├── controllers/                 # Route handlers
│   │   ├── models/
│   │   │   ├── Agent.js                 # Agent schema (roles, availability slots)
│   │   │   ├── Listing.js               # Listing schema (tags, sold fields)
│   │   │   ├── Showing.js               # Showing schema
│   │   │   ├── Notification.js          # Notification schema
│   │   │   └── OpenHouse.js             # Open house schema
│   │   ├── routes/                      # Express route definitions
│   │   ├── scripts/
│   │   │   ├── seedAgents.js            # 7 realistic agents (run first)
│   │   │   ├── seedListings.js          # 45 listings across 5 US markets
│   │   │   └── seedShowings.js          # 32 showings with realistic date spread
│   │   ├── tests/
│   │   │   ├── listings.test.js         # Listing CRUD + filters
│   │   │   ├── showings.test.js         # Showing CRUD + authorization
│   │   │   ├── notifications.test.js    # Notification flow
│   │   │   ├── agentAvailability.test.js
│   │   │   ├── openHouses.test.js
│   │   │   ├── reports.test.js
│   │   │   └── seedData.test.js         # Model validation for seed data
│   │   ├── utils/                       # Error handlers, validators
│   │   ├── app.js                       # Express app setup
│   │   └── server.js                    # Entry point
│   ├── .env.example                     # Environment template
│   └── package.json
└── package.json                         # Root (concurrently)
```
