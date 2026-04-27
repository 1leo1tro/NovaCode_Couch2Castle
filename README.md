# Couch2Castle

A full-stack real estate listing platform built with the MERN stack. Agents can create and manage property listings, schedule showings, run analytics reports, and host open houses. Buyers can browse listings on an interactive map, bookmark properties, and request tours.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Axios, Mapbox GL JS, Framer Motion |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB (Atlas or local) |
| Auth | JWT (stored in httpOnly cookie) |
| Testing | Jest, Supertest, MongoDB Memory Server |

## Project Structure

```
NovaCode_Couch2Castle/
├── client/          # React + Vite frontend (port 5173)
└── server/          # Express API (port 5001)
    └── src/
        ├── controllers/
        ├── models/
        ├── routes/
        ├── scripts/   # seed scripts
        └── tests/
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas URI)
- Mapbox API token

### Install

```bash
npm install              # root (concurrently)
cd client && npm install
cd ../server && npm install
```

### Environment

Copy `server/.env.example` to `server/.env` and fill in:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Add to `client/.env`:

```
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### Run

```bash
npm run dev          # starts both frontend and backend concurrently
```

Or individually:

```bash
npm run dev:client   # React on http://localhost:5173
npm run dev:server   # Express on http://localhost:5001
```

## Seeding the Database

Run the three seed scripts **in order** — agents must exist before listings, and listings before showings:

```bash
cd server
npm run seed:agents   # 15 agents (roles, licenses, availability)
npm run seed          # 983 listings across 5 US cities
npm run seed:showings # showings with past/future dates
```

Each script clears its collection before inserting.

**Demo logins:**

| Role | Email | Password |
|------|-------|----------|
| Home Buyer | `alex.johnson@example.com` | `password123` |
| Agent | `derek.fountain@novarealty.com` | `password123` |
| Manager | `margaret.holloway@novarealty.com` | `password123` |

## Key Features

- **Interactive map** — Mapbox GL with clustering, city boundary outlines, and real-time bounds-based listing filtering
- **Listings** — search by keyword, price range, square footage, ZIP, and status; paginated results
- **Showings** — agents request tours; listing owner cannot request a tour on their own listing
- **Open Houses** — create and manage public open house events
- **Bookmarks** — save and revisit favorite properties
- **Agent Portal** — manage own listings, review and confirm showing requests, view availability calendar
- **Manager Portal** — view all agents, listings, and showings; role-based access control
- **Reports** — analytics dashboard with charts (manager-only)
- **Dark mode** — full theme support via CSS variables

## API Overview

All routes are prefixed with `/api`.

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /auth/login`, `POST /auth/signup`, `POST /auth/logout`, `GET /auth/me` |
| Listings | `GET/POST /listings`, `GET/PUT/PATCH/DELETE /listings/:id` |
| Showings | `GET/POST /showings`, `GET/PUT/DELETE /showings/:id` |
| Open Houses | `GET/POST /open-houses`, `GET/PUT/DELETE /open-houses/:id` |
| Agents | `GET /agents`, `GET/PUT /agents/:id` |
| Reports | `GET /reports/summary` (manager only) |
| Notifications | `GET /notifications`, `POST /notifications/read` |

**Listing query params:** `keyword`, `minPrice`, `maxPrice`, `minSquareFeet`, `maxSquareFeet`, `zipCode`, `status`, `page`, `limit`, `sortBy`, `order`

## Testing

```bash
cd server
npm test              # run all test suites
npm run test:coverage # with coverage report
```

| Suite | Coverage |
|-------|----------|
| `listings.test.js` | CRUD, filters, pagination, ownership |
| `showings.test.js` | CRUD, status transitions, authorization |
| `notifications.test.js` | Creation on showing request, mark-as-read |
| `agentAvailability.test.js` | GET/PUT availability slots |
| `openHouses.test.js` | Open house CRUD and auth |
| `reports.test.js` | Role-based access control |
| `seedData.test.js` | Model validation for all seed data |
