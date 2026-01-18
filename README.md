# MERN Stack Starter

A clean, cross-platform MERN stack starter project.

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
   - Adjust values if needed

### Running the Project

**Run both frontend and backend:**
```bash
npm run dev
```

**Run individually:**
```bash
npm run dev:client    # Frontend only (port 5173)
npm run dev:server    # Backend only (port 5000)
```

## Tech Stack

- **Frontend**: React (Vite), React Router, Axios
- **Backend**: Node.js, Express, CORS

## Ports

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`
