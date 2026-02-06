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

| Method | Route               | Description                          |
|--------|---------------------|--------------------------------------|
| POST   | `/api/listings`     | Create a new listing                 |
| GET    | `/api/listings`     | Get all listings (supports filters)  |
| GET    | `/api/listings/:id` | Get a single listing by ID           |

**Query parameters for `GET /api/listings`:**
- `minPrice` - minimum price filter
- `maxPrice` - maximum price filter
- `zipCode` - filter by 5-digit ZIP code

## Testing

Tests use an in-memory MongoDB instance, so no external database is required.

```bash
cd server
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

See [server/src/tests/TestingREADME.md](server/src/tests/TestingREADME.md) for detailed test documentation.

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
