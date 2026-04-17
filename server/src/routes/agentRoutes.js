import express from 'express';
import {
  updateAgentAvailability,
  getAgentAvailability,
  getAgentAvailabilityById
} from '../controllers/agentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public route - get any agent's availability by their ID (no auth required)
router.get('/agents/:agentId/availability', getAgentAvailabilityById);

// Protected routes (authentication required - agent only)
router.put('/agents/me/availability', protect, updateAgentAvailability);
router.get('/agents/me/availability', protect, getAgentAvailability);

export default router;