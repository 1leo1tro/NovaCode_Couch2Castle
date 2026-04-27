import express from 'express';
import {
  updateAgentAvailability,
  getAgentAvailability,
  getAgentAvailabilityById,
  createAgentAsManager,
} from '../controllers/agentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Manager: create a new agent
router.post('/agents', protect, authorize('manager'), createAgentAsManager);

// Protected routes must come before /:agentId to prevent "me" matching the param
router.put('/agents/me/availability', protect, updateAgentAvailability);
router.get('/agents/me/availability', protect, getAgentAvailability);

// Public route - get any agent's availability by their ID (no auth required)
router.get('/agents/:agentId/availability', getAgentAvailabilityById);

export default router;