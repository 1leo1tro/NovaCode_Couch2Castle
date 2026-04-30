import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import listingRoutes from './routes/listingRoutes.js';
import authRoutes from './routes/authRoutes.js';
import showingRoutes from './routes/showingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import openHouseRoutes from './routes/openHouseRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://couch2castle.site',
    'https://www.couch2castle.site',
    'https://nova-code-couch2castle.vercel.app'
  ]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', listingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', showingRoutes);
app.use('/api', notificationRoutes);
app.use('/api', reportRoutes);
app.use('/api', openHouseRoutes);
app.use('/api', agentRoutes);
app.use('/api', uploadRoutes);
// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

export default app;
