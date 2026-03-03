import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.get('/notifications', protect, getNotifications);
router.get('/notifications/count/unread', protect, getUnreadCount);
router.patch('/notifications/read-all', protect, markAllAsRead);
router.patch('/notifications/:id/read', protect, markAsRead);

export default router;
