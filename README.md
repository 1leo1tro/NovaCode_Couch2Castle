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

4. Set up environment:
   - Copy `server/.env.example` to `server/.env`
   - Set `MONGO_URI` to your MongoDB connection string

### Running the Project

**Run both frontend and backend:**
```bash
npm run dev
```

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
