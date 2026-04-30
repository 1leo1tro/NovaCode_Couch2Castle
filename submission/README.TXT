================================================================================
  COUCH2CASTLE — Build & Run Instructions
================================================================================

PROJECT OVERVIEW
----------------
Couch2Castle is a full-stack real estate listing platform built with the MERN
stack (MongoDB, Express, React, Node.js). Agents can create and manage property
listings, schedule showings, run analytics reports, and host open houses.
Buyers can browse listings on an interactive map, bookmark properties, and
request tours.


PREREQUISITES
-------------
  - Node.js v18 or higher   (https://nodejs.org)
  - npm v9 or higher        (bundled with Node.js)
  - MongoDB Atlas account   (https://www.mongodb.com/atlas) OR a local MongoDB instance
  - Mapbox account + token  (https://www.mapbox.com)


ENVIRONMENT SETUP
-----------------
1. Copy the server environment template:

     cp server/.env.example server/.env

2. Open server/.env and fill in the following values:

     MONGO_URI=<your MongoDB connection string>
     JWT_SECRET=<any long random string>

3. Create the client environment file:

     Create a new file at: client/.env

   Add the following line:

     VITE_MAPBOX_TOKEN=<your Mapbox public token>


INSTALL DEPENDENCIES
--------------------
Run the following commands from the project root directory:

     npm install
     cd client && npm install && cd ..
     cd server && npm install && cd ..


SEED THE DATABASE
-----------------
Run the three seed scripts IN ORDER from the server/ directory:

     cd server
     npm run seed:agents     # Seeds 15 agents (run this first)
     npm run seed            # Seeds ~983 listings across 5 US cities
     npm run seed:showings   # Seeds showings with realistic date spread
     cd ..

Each script clears its collection before inserting new data.


RUN THE PROJECT
---------------
From the project root directory, run both frontend and backend together:

     npm run dev

  - Frontend (React/Vite):  http://localhost:5173
  - Backend (Express API):  http://localhost:5001

To run individually:

     npm run dev:client      # Frontend only
     npm run dev:server      # Backend only


DEMO LOGINS
-----------
  Role         Email                               Password
  -----------  ----------------------------------  -----------
  Home Buyer   alex.johnson@example.com            password123
  Agent        derek.fountain@novarealty.com       password123
  Manager      margaret.holloway@novarealty.com    password123


RUN TESTS
---------
From the server/ directory:

     cd server
     npm test                # Run all test suites
     npm run test:coverage   # Run with coverage report


PROJECT STRUCTURE
-----------------
  NovaCode_Couch2Castle/
  ├── client/                  React + Vite frontend
  │   ├── src/
  │   │   ├── components/      Shared UI components (Navbar, ListingCard, Map, etc.)
  │   │   ├── context/         React context providers (Auth, Theme, Bookmarks)
  │   │   ├── pages/           Page components (Listings, PropertyDetails, etc.)
  │   │   └── styles/          CSS stylesheets
  │   └── package.json
  ├── server/
  │   ├── src/
  │   │   ├── controllers/     Express route handlers
  │   │   ├── models/          Mongoose schemas (Agent, Listing, Showing, etc.)
  │   │   ├── routes/          Express route definitions
  │   │   ├── scripts/         Database seed scripts
  │   │   ├── tests/           Jest + Supertest test suites
  │   │   └── utils/           Validators and error handlers
  │   ├── .env.example         Environment variable template
  │   └── package.json
  └── package.json             Root (runs both client and server via concurrently)


KEY BUILD FILES
---------------
  package.json              Root — install and run scripts
  client/package.json       Frontend dependencies and Vite config
  server/package.json       Backend dependencies and test scripts
  server/.env.example       Environment variable template
  server/src/scripts/       Seed scripts for database population


================================================================================
