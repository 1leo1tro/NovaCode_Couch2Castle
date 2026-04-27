import jwt from 'jsonwebtoken';
import Agent from '../models/Agent.js';
import { createErrorResponse, handleUnauthorized, handleForbidden } from '../utils/errorHandler.js';

// Middleware to protect routes - verifies JWT token
export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get agent from token (exclude password)
      req.agent = await Agent.findById(decoded.id).select('-password');

      if (!req.agent) {
        return res.status(401).json(handleUnauthorized('Not authorized', 'Agent not found'));
      }

      // Check if agent is active
      if (!req.agent.isActive) {
        return res.status(403).json(handleForbidden('Account disabled', 'This agent account has been deactivated'));
      }

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json(handleUnauthorized('Not authorized', 'Invalid token'));
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json(handleUnauthorized('Token expired', 'Your session has expired. Please log in again.'));
      }

      return res.status(401).json(handleUnauthorized('Not authorized', 'Token verification failed'));
    }
  }

  if (!token) {
    return res.status(401).json(
      handleUnauthorized('Not authorized', 'No token provided. Please include a valid token in the Authorization header.')
    );
  }
};

// Optional auth — attaches req.agent if a valid token is present, never blocks
export const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const agent = await Agent.findById(decoded.id).select('-password');
    if (agent?.isActive) req.agent = agent;
  } catch {
    // invalid / expired token — ignore, proceed as unauthenticated
  }
  next();
};

// Middleware to check if agent is active (optional additional check)
export const checkActive = (req, res, next) => {
  if (!req.agent.isActive) {
    return res.status(403).json(handleForbidden('Account disabled', 'This agent account has been deactivated'));
  }
  next();
};

// Middleware to authorize by role
export const authorize = (...roles) => (req, res, next) => {
  if (!req.agent) {
    return res.status(401).json(handleUnauthorized('Not authorized', 'Authentication required'));
  }

  const agentRole = req.agent.role || 'agent';

  if (!roles.includes(agentRole)) {
    return res.status(403).json(
      handleForbidden('Forbidden', 'You do not have permission to access this resource')
    );
  }

  next();
};
