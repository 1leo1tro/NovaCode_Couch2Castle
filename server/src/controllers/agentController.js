import Agent from '../models/Agent.js';
import {
  handleValidationError,
  handleDatabaseError,
  isDatabaseConnectionError,
  isValidationError,
  createErrorResponse
} from '../utils/errorHandler.js';

// Update agent's availability slots
export const updateAgentAvailability = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const { availabilitySlots } = req.body;

    // Validate that availabilitySlots is an array
    if (!Array.isArray(availabilitySlots)) {
      return res.status(400).json(
        createErrorResponse(
          'Invalid input',
          'Availability slots must be provided as an array'
        )
      );
    }

    // Validate each slot in the array
    for (const slot of availabilitySlots) {
      // Check required fields
      if (!slot.dayOfWeek && slot.dayOfWeek !== 0) {
        return res.status(400).json(
          createErrorResponse(
            'Invalid input',
            'Each availability slot must include a dayOfWeek'
          )
        );
      }
      
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        return res.status(400).json(
          createErrorResponse(
            'Invalid input',
            'Day of week must be between 0 and 6 (0 = Sunday, 6 = Saturday)'
          )
        );
      }

      if (!slot.startTime) {
        return res.status(400).json(
          createErrorResponse(
            'Invalid input',
            'Each availability slot must include a startTime'
          )
        );
      }

      if (!slot.endTime) {
        return res.status(400).json(
          createErrorResponse(
            'Invalid input',
            'Each availability slot must include an endTime'
          )
        );
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.startTime)) {
        return res.status(400).json(
          createErrorResponse(
            'Invalid input',
            'Start time must be in HH:MM format (e.g., 10:30)'
          )
        );
      }

      if (!timeRegex.test(slot.endTime)) {
        return res.status(400).json(
          createErrorResponse(
            'Invalid input',
            'End time must be in HH:MM format (e.g., 17:30)'
          )
        );
      }
    }

    // Update agent's availability slots
    const updatedAgent = await Agent.findByIdAndUpdate(
      agentId,
      { availabilitySlots },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Availability slots updated successfully',
      agent: updatedAgent
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json(handleValidationError(error));
    }
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error updating availability slots', error.message, { type: error.name })
    );
  }
};

// Public: Get any agent's availability slots by agent ID (no auth required)
export const getAgentAvailabilityById = async (req, res) => {
  try {
    const { agentId } = req.params;

    const agent = await Agent.findById(agentId).select('availabilitySlots name');

    if (!agent) {
      return res.status(404).json(
        createErrorResponse('Agent not found', 'No agent found with the provided ID')
      );
    }

    res.json({
      availabilitySlots: agent.availabilitySlots || []
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error fetching availability slots', error.message, { type: error.name })
    );
  }
};

// Get agent's availability slots
export const getAgentAvailability = async (req, res) => {
  try {
    const agentId = req.agent._id;
    
    const agent = await Agent.findById(agentId).select('availabilitySlots');
    
    if (!agent) {
      return res.status(404).json(
        createErrorResponse('Agent not found', 'No agent found with the provided ID')
      );
    }
    
    res.json({
      availabilitySlots: agent.availabilitySlots || []
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error fetching availability slots', error.message, { type: error.name })
    );
  }
};