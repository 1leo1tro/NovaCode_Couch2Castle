import Notification from '../models/Notification.js';
import {
  handleDatabaseError,
  handleNotFoundError,
  isDatabaseConnectionError,
  createErrorResponse
} from '../utils/errorHandler.js';
import { validateObjectId, validatePagination } from '../utils/validators.js';

// Get notifications for the authenticated agent (PROTECTED)
export const getNotifications = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const { unreadOnly, page, limit } = req.query;

    // Build query
    const query = { recipient: agentId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    // Validate pagination
    const paginationValidation = validatePagination(page, limit);
    if (!paginationValidation.isValid) {
      return res.status(400).json(paginationValidation.error);
    }
    const { page: currentPage, limit: pageLimit } = paginationValidation.pagination;
    const skip = (currentPage - 1) * pageLimit;

    const [notifications, totalCount] = await Promise.all([
      Notification.find(query)
        .populate('relatedListing', 'address zipCode price')
        .populate('relatedShowing', 'name email preferredDate status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),
      Notification.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    res.json({
      notifications,
      count: totalCount,
      page: currentPage,
      totalPages
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error fetching notifications', error.message, { type: error.name })
    );
  }
};

// Get count of unread notifications (PROTECTED)
export const getUnreadCount = async (req, res) => {
  try {
    const agentId = req.agent._id;

    const count = await Notification.countDocuments({
      recipient: agentId,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error fetching unread count', error.message, { type: error.name })
    );
  }
};

// Mark a single notification as read (PROTECTED)
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.agent._id;

    // Validate ID format
    const idValidation = validateObjectId(id);
    if (!idValidation.isValid) {
      return res.status(400).json(idValidation.error);
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json(handleNotFoundError('Notification', id));
    }

    // Verify ownership
    if (String(notification.recipient) !== String(agentId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own notifications'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error updating notification', error.message, { type: error.name })
    );
  }
};

// Mark all notifications as read for the authenticated agent (PROTECTED)
export const markAllAsRead = async (req, res) => {
  try {
    const agentId = req.agent._id;

    const result = await Notification.updateMany(
      { recipient: agentId, isRead: false },
      { isRead: true }
    );

    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json(handleDatabaseError());
    }
    res.status(500).json(
      createErrorResponse('Error updating notifications', error.message, { type: error.name })
    );
  }
};
