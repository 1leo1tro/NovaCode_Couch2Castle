import express from 'express';
import {
  updateAgentAvailability,
  getAgentAvailability
} from '../controllers/agentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (authentication required - agent only)
router.put('/agents/me/availability', protect, updateAgentAvailability);
router.get('/agents/me/availability', protect, getAgentAvailability);

export default router;