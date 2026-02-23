import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import listingRoutes from './routes/listingRoutes.js';
import authRoutes from './routes/authRoutes.js';
import showingRoutes from './routes/showingRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    'http://127.0.0.1:5173'
  ]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', listingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', showingRoutes);
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
