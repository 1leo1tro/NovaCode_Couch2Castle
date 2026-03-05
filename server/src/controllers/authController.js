import jwt from 'jsonwebtoken';
import Agent from '../models/Agent.js';
import {
  handleValidationError,
  handleDuplicateKeyError,
  handleDatabaseError,
  isDatabaseConnectionError,
  isValidationError,
  isDuplicateKeyError,
  createErrorResponse,
  handleUnauthorized,
  handleForbidden
} from '../utils/errorHandler.js';

// Generate JWT token
const generateToken = (agentId) => {
  return jwt.sign(
    { id: agentId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new agent
// @route   POST /api/auth/register
// @access  Public (for now - in production, this should be admin-only)
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, licenseNumber } = req.body;

    // Check if agent already exists
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res.status(409).json(
        createErrorResponse(
          'Agent already exists',
          'An agent with this email address is already registered',
          { email }
        )
      );
    }

    // Create new agent (password will be hashed automatically by pre-save middleware)
    const agent = await Agent.create({
      name,
      email,
      password,
      phone,
      licenseNumber
    });

    // Generate JWT token
    const token = generateToken(agent._id);

    // Return success response with token and agent data
    res.status(201).json({
      message: 'Agent registered successfully',
      token,
      agent: agent.toPublicJSON()
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json(handleValidationError(error));
    }
    if (isDuplicateKeyError(error)) {
      return res.status(409).json(handleDuplicateKeyError(error));
    }
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error registering agent', error.message, { type: error.name })
    );
  }
};

// @desc    Login agent
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(
        createErrorResponse(
          'Missing credentials',
          'Please provide both email and password'
        )
      );
    }

    // Find agent by email and explicitly select password field
    const agent = await Agent.findOne({ email }).select('+password');

    // Check if agent exists and password is correct
    // Use generic message to not reveal if email exists or password is wrong
    if (!agent || !(await agent.comparePassword(password))) {
      return res.status(401).json(handleUnauthorized('Invalid credentials', 'The email or password you entered is incorrect'));
    }

    // Check if agent account is active
    if (!agent.isActive) {
      return res.status(403).json(handleForbidden('Account disabled', 'This agent account has been deactivated. Please contact support.'));
    }

    // Generate JWT token
    const token = generateToken(agent._id);

    // Return success response with token and agent data
    res.json({
      message: 'Login successful',
      token,
      agent: agent.toPublicJSON()
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error during login', error.message, { type: error.name })
    );
  }
};

// @desc    Get current logged-in agent profile
// @route   GET /api/auth/me
// @access  Private (requires authentication middleware)
export const getMe = async (req, res) => {
  try {
    // req.agent is set by auth middleware
    const agent = await Agent.findById(req.agent.id);

    if (!agent) {
      return res.status(404).json(
        createErrorResponse(
          'Agent not found',
          'No agent found with this ID'
        )
      );
    }

    res.json({
      agent: agent.toPublicJSON()
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }

    res.status(500).json(
      createErrorResponse('Error fetching agent profile', error.message, { type: error.name })
    );
  }
};
