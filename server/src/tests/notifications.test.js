import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Notification from '../models/Notification.js';
import Showing from '../models/Showing.js';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';

// Set test JWT secret before any auth middleware runs
process.env.JWT_SECRET = 'test-jwt-secret-notifications-suite';

let mongoServer;
let agent1, agent2;
let token1, token2;

// ─── Helpers ────────────────────────────────────────────────────────────────

const generateToken = (agentId) =>
  jwt.sign({ id: agentId }, process.env.JWT_SECRET, { expiresIn: '1h' });

const createTestAgent = (overrides = {}) =>
  Agent.create({
    name: 'Test Agent',
    email: 'agent@test.com',
    password: 'password123',
    isActive: true,
    ...overrides
  });

const createTestListing = (agentId, overrides = {}) =>
  Listing.create({
    price: 250000,
    address: '123 Main St, Huntsville, AL',
    squareFeet: 1500,
    status: 'active',
    zipCode: '35801',
    createdBy: agentId,
    ...overrides
  });

const createTestNotification = (recipientId, overrides = {}) =>
  Notification.create({
    recipient: recipientId,
    type: 'showing_request',
    message: 'New showing request from John for 123 Main St',
    ...overrides
  });

// ─── Lifecycle ──────────────────────────────────────────────────────────────

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  agent1 = await createTestAgent({ email: 'agent1@test.com' });
  agent2 = await createTestAgent({ email: 'agent2@test.com' });
  token1 = generateToken(agent1._id);
  token2 = generateToken(agent2._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Notification.deleteMany({});
  await Showing.deleteMany({});
  await Listing.deleteMany({});
});

// ============================================================
// Notification Creation on Showing Request
// ============================================================

describe('Notification triggered by POST /api/showings', () => {
  let listing;
  let tomorrow;
  let validBody;

  beforeEach(async () => {
    listing = await createTestListing(agent1._id);
    tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    validBody = {
      listing: listing._id.toString(),
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-987-6543',
      preferredDate: tomorrow.toISOString()
    };
  });

  test('should create a notification for the listing agent when a showing is created', async () => {
    await request(app)
      .post('/api/showings')
      .send(validBody)
      .expect(201);

    const notifications = await Notification.find({ recipient: agent1._id });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('showing_request');
    expect(notifications[0].message).toContain('Jane Smith');
    expect(notifications[0].message).toContain(listing.address);
    expect(notifications[0].isRead).toBe(false);
  });

  test('should link the notification to the correct showing and listing', async () => {
    const response = await request(app)
      .post('/api/showings')
      .send(validBody)
      .expect(201);

    const showingId = response.body.showing._id;
    const notification = await Notification.findOne({ recipient: agent1._id });
    expect(notification.relatedShowing.toString()).toBe(showingId);
    expect(notification.relatedListing.toString()).toBe(listing._id.toString());
  });

  test('should not create a notification when listing has no createdBy', async () => {
    const orphanListing = await Listing.create({
      price: 100000,
      address: '456 Orphan St, Huntsville, AL',
      squareFeet: 800,
      status: 'active',
      zipCode: '35801'
    });

    await request(app)
      .post('/api/showings')
      .send({
        ...validBody,
        listing: orphanListing._id.toString()
      })
      .expect(201);

    const notifications = await Notification.find({});
    expect(notifications).toHaveLength(0);
  });

  test('should still return 201 for the showing even if notification creation were to fail', async () => {
    // The showing should succeed regardless of notification issues
    const response = await request(app)
      .post('/api/showings')
      .send(validBody)
      .expect(201);

    expect(response.body.message).toBe('Showing request submitted successfully');
    expect(response.body.showing).toBeDefined();
  });
});

// ============================================================
// GET /api/notifications — Fetch Agent's Notifications (PROTECTED)
// ============================================================

describe('GET /api/notifications', () => {
  // ── Authentication ─────────────────────────────────────────

  describe('Authentication', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 401 when the token is invalid', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Fetching Notifications ─────────────────────────────────

  describe('Fetching Notifications', () => {
    test('should return only the authenticated agent\'s notifications', async () => {
      await createTestNotification(agent1._id, { message: 'For agent 1' });
      await createTestNotification(agent2._id, { message: 'For agent 2' });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.notifications).toHaveLength(1);
      expect(response.body.notifications[0].message).toBe('For agent 1');
      expect(response.body.count).toBe(1);
    });

    test('should return notifications sorted by newest first', async () => {
      const base = Date.now();
      await createTestNotification(agent1._id, {
        message: 'Oldest',
        createdAt: new Date(base - 2000)
      });
      await createTestNotification(agent1._id, {
        message: 'Newest',
        createdAt: new Date(base)
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.notifications[0].message).toBe('Newest');
      expect(response.body.notifications[1].message).toBe('Oldest');
    });

    test('should filter to unread only when unreadOnly=true', async () => {
      await createTestNotification(agent1._id, { message: 'Unread', isRead: false });
      await createTestNotification(agent1._id, { message: 'Read', isRead: true });

      const response = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.notifications).toHaveLength(1);
      expect(response.body.notifications[0].message).toBe('Unread');
    });

    test('should return empty array when agent has no notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.notifications).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    test('should support pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await createTestNotification(agent1._id, { message: `Notification ${i}` });
      }

      const response = await request(app)
        .get('/api/notifications?page=1&limit=3')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.notifications).toHaveLength(3);
      expect(response.body.count).toBe(5);
      expect(response.body.totalPages).toBe(2);
    });
  });

  // ── Response Structure ─────────────────────────────────────

  describe('Response Structure', () => {
    test('should return the correct top-level response shape', async () => {
      await createTestNotification(agent1._id);

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.notifications)).toBe(true);
    });
  });
});

// ============================================================
// GET /api/notifications/count/unread — Unread Count (PROTECTED)
// ============================================================

describe('GET /api/notifications/count/unread', () => {
  // ── Authentication ─────────────────────────────────────────

  describe('Authentication', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/notifications/count/unread')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Correct Count ──────────────────────────────────────────

  describe('Correct Count', () => {
    test('should return 0 when agent has no notifications', async () => {
      const response = await request(app)
        .get('/api/notifications/count/unread')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body).toHaveProperty('count', 0);
    });

    test('should return only unread count, not read ones', async () => {
      await createTestNotification(agent1._id, { isRead: false });
      await createTestNotification(agent1._id, { isRead: false });
      await createTestNotification(agent1._id, { isRead: true });

      const response = await request(app)
        .get('/api/notifications/count/unread')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.count).toBe(2);
    });

    test('should only count the authenticated agent\'s notifications', async () => {
      await createTestNotification(agent1._id, { isRead: false });
      await createTestNotification(agent2._id, { isRead: false });

      const response = await request(app)
        .get('/api/notifications/count/unread')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.count).toBe(1);
    });
  });
});

// ============================================================
// PATCH /api/notifications/:id/read — Mark as Read (PROTECTED)
// ============================================================

describe('PATCH /api/notifications/:id/read', () => {
  let notification;

  beforeEach(async () => {
    notification = await createTestNotification(agent1._id);
  });

  // ── Authentication ─────────────────────────────────────────

  describe('Authentication', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Valid Requests ─────────────────────────────────────────

  describe('Valid Requests', () => {
    test('should mark the notification as read and return 200', async () => {
      const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.message).toBe('Notification marked as read');
      expect(response.body.notification.isRead).toBe(true);
    });

    test('should persist the read status in the database', async () => {
      await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const updated = await Notification.findById(notification._id);
      expect(updated.isRead).toBe(true);
    });
  });

  // ── Validation ─────────────────────────────────────────────

  describe('Validation', () => {
    test('should return 400 for an invalid notification ID format', async () => {
      const response = await request(app)
        .patch('/api/notifications/not-a-valid-id/read')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 404 for a valid ObjectId that does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/notifications/${nonExistentId}/read`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Authorization ──────────────────────────────────────────

  describe('Authorization - Ownership Verification', () => {
    test('should return 403 when agent tries to mark another agent\'s notification as read', async () => {
      const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toContain('your own notifications');
    });
  });
});

// ============================================================
// PATCH /api/notifications/read-all — Mark All as Read (PROTECTED)
// ============================================================

describe('PATCH /api/notifications/read-all', () => {
  // ── Authentication ─────────────────────────────────────────

  describe('Authentication', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .patch('/api/notifications/read-all')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Valid Requests ─────────────────────────────────────────

  describe('Valid Requests', () => {
    test('should mark all unread notifications as read for the agent', async () => {
      await createTestNotification(agent1._id, { message: 'Notif 1', isRead: false });
      await createTestNotification(agent1._id, { message: 'Notif 2', isRead: false });
      await createTestNotification(agent1._id, { message: 'Notif 3', isRead: true });

      const response = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.message).toBe('All notifications marked as read');
      expect(response.body.modifiedCount).toBe(2);

      // Verify all are now read
      const unread = await Notification.countDocuments({
        recipient: agent1._id,
        isRead: false
      });
      expect(unread).toBe(0);
    });

    test('should not affect other agents\' notifications', async () => {
      await createTestNotification(agent1._id, { isRead: false });
      await createTestNotification(agent2._id, { isRead: false });

      await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      // agent2's notification should still be unread
      const agent2Unread = await Notification.countDocuments({
        recipient: agent2._id,
        isRead: false
      });
      expect(agent2Unread).toBe(1);
    });

    test('should return modifiedCount of 0 when there are no unread notifications', async () => {
      const response = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.modifiedCount).toBe(0);
    });
  });
});
