import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import app from '../app.js';
import OpenHouse from '../models/OpenHouse.js';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';

// Set test JWT secret before any auth middleware runs
process.env.JWT_SECRET = 'test-jwt-secret-openhouse-suite';

jest.setTimeout(30000);

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

const createTestOpenHouse = (listingId, agentId, overrides = {}) =>
  OpenHouse.create({
    listing: listingId,
    agentId,
    date: new Date('2026-05-15'),
    startTime: '10:00',
    endTime: '12:00',
    notes: 'Test open house',
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
  await OpenHouse.deleteMany({});
  await Listing.deleteMany({});
});

// ─── POST /api/open-houses ───────────────────────────────────────────────────

describe('POST /api/open-houses', () => {
  test('should create an open house for an owned listing', async () => {
    const listing = await createTestListing(agent1._id);

    const response = await request(app)
      .post('/api/open-houses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        listing: listing._id,
        date: '2026-05-15',
        startTime: '10:00',
        endTime: '12:00',
        notes: 'Saturday open house'
      })
      .expect(201);

    expect(response.body.message).toBe('Open house created successfully');
    expect(response.body.openHouse).toBeDefined();
    expect(response.body.openHouse.startTime).toBe('10:00');
    expect(response.body.openHouse.endTime).toBe('12:00');
    expect(response.body.openHouse.notes).toBe('Saturday open house');
  });

  test('should set agentId from authenticated agent', async () => {
    const listing = await createTestListing(agent1._id);

    const response = await request(app)
      .post('/api/open-houses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        listing: listing._id,
        date: '2026-05-15',
        startTime: '10:00',
        endTime: '12:00'
      })
      .expect(201);

    expect(response.body.openHouse.agentId._id).toBe(agent1._id.toString());
  });

  test('should populate listing address and price in response', async () => {
    const listing = await createTestListing(agent1._id, { price: 300000 });

    const response = await request(app)
      .post('/api/open-houses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        listing: listing._id,
        date: '2026-05-15',
        startTime: '10:00',
        endTime: '12:00'
      })
      .expect(201);

    expect(response.body.openHouse.listing).toHaveProperty('address');
    expect(response.body.openHouse.listing).toHaveProperty('price', 300000);
  });

  test('should reject creating open house for another agent\'s listing', async () => {
    const listing = await createTestListing(agent2._id);

    const response = await request(app)
      .post('/api/open-houses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        listing: listing._id,
        date: '2026-05-15',
        startTime: '10:00',
        endTime: '12:00'
      })
      .expect(403);

    expect(response.body.message).toBe('Access denied');
    expect(response.body.error).toContain('your own listings');
  });

  test('should return 404 when listing does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post('/api/open-houses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        listing: nonExistentId,
        date: '2026-05-15',
        startTime: '10:00',
        endTime: '12:00'
      })
      .expect(404);

    expect(response.body).toHaveProperty('message');
  });

  test('should reject invalid time format', async () => {
    const listing = await createTestListing(agent1._id);

    const response = await request(app)
      .post('/api/open-houses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        listing: listing._id,
        date: '2026-05-15',
        startTime: '10:00 AM',
        endTime: '12:00'
      })
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('should reject missing required fields', async () => {
    const listing = await createTestListing(agent1._id);

    const response = await request(app)
      .post('/api/open-houses')
      .set('Authorization', `Bearer ${token1}`)
      .send({ listing: listing._id })
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 401 without auth token', async () => {
    const listing = await createTestListing(agent1._id);

    await request(app)
      .post('/api/open-houses')
      .send({
        listing: listing._id,
        date: '2026-05-15',
        startTime: '10:00',
        endTime: '12:00'
      })
      .expect(401);
  });
});

// ─── GET /api/open-houses ────────────────────────────────────────────────────

describe('GET /api/open-houses', () => {
  test('should return only open houses for the authenticated agent\'s listings', async () => {
    const listing1 = await createTestListing(agent1._id);
    const listing2 = await createTestListing(agent2._id);
    await createTestOpenHouse(listing1._id, agent1._id);
    await createTestOpenHouse(listing1._id, agent1._id, { startTime: '14:00', endTime: '16:00' });
    await createTestOpenHouse(listing2._id, agent2._id);

    const response = await request(app)
      .get('/api/open-houses')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(response.body.openHouses).toHaveLength(2);
    expect(response.body.count).toBe(2);
  });

  test('should return empty array when agent has no listings', async () => {
    const response = await request(app)
      .get('/api/open-houses')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(response.body.openHouses).toHaveLength(0);
    expect(response.body.count).toBe(0);
  });

  test('should filter by listingId', async () => {
    const listing1 = await createTestListing(agent1._id);
    const listing2 = await createTestListing(agent1._id, {
      address: '456 Oak Ave, Huntsville, AL',
      zipCode: '35802'
    });
    await createTestOpenHouse(listing1._id, agent1._id);
    await createTestOpenHouse(listing2._id, agent1._id);

    const response = await request(app)
      .get(`/api/open-houses?listingId=${listing1._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(response.body.openHouses).toHaveLength(1);
    expect(response.body.openHouses[0].listing._id).toBe(listing1._id.toString());
  });

  test('should reject filtering by another agent\'s listing', async () => {
    const listing2 = await createTestListing(agent2._id);

    const response = await request(app)
      .get(`/api/open-houses?listingId=${listing2._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(403);

    expect(response.body.error).toBe('Access denied');
  });

  test('should return 400 for invalid listingId format', async () => {
    const response = await request(app)
      .get('/api/open-houses?listingId=not-valid')
      .set('Authorization', `Bearer ${token1}`)
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('should return populated listing and agent fields', async () => {
    const listing = await createTestListing(agent1._id);
    await createTestOpenHouse(listing._id, agent1._id);

    const response = await request(app)
      .get('/api/open-houses')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    const oh = response.body.openHouses[0];
    expect(oh.listing).toHaveProperty('address');
    expect(oh.listing).toHaveProperty('price');
    expect(oh.agentId).toHaveProperty('name');
    expect(oh.agentId).toHaveProperty('email');
  });

  test('should return 401 without auth token', async () => {
    await request(app)
      .get('/api/open-houses')
      .expect(401);
  });
});

// ─── GET /api/open-houses/:id ────────────────────────────────────────────────

describe('GET /api/open-houses/:id', () => {
  test('should return a single open house by ID', async () => {
    const listing = await createTestListing(agent1._id);
    const oh = await createTestOpenHouse(listing._id, agent1._id);

    const response = await request(app)
      .get(`/api/open-houses/${oh._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(response.body.openHouse._id).toBe(oh._id.toString());
    expect(response.body.openHouse.startTime).toBe('10:00');
  });

  test('should deny access to another agent\'s open house', async () => {
    const listing = await createTestListing(agent2._id);
    const oh = await createTestOpenHouse(listing._id, agent2._id);

    const response = await request(app)
      .get(`/api/open-houses/${oh._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(403);

    expect(response.body.error).toBe('Access denied');
  });

  test('should return 404 for non-existent ID', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/open-houses/${nonExistentId}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(404);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 400 for invalid ID format', async () => {
    const response = await request(app)
      .get('/api/open-houses/not-valid-id')
      .set('Authorization', `Bearer ${token1}`)
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 401 without auth token', async () => {
    const listing = await createTestListing(agent1._id);
    const oh = await createTestOpenHouse(listing._id, agent1._id);

    await request(app)
      .get(`/api/open-houses/${oh._id}`)
      .expect(401);
  });
});

// ─── PUT /api/open-houses/:id ────────────────────────────────────────────────

describe('PUT /api/open-houses/:id', () => {
  test('should update an open house owned by the agent', async () => {
    const listing = await createTestListing(agent1._id);
    const oh = await createTestOpenHouse(listing._id, agent1._id);

    const response = await request(app)
      .put(`/api/open-houses/${oh._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ startTime: '11:00', endTime: '13:00', notes: 'Updated notes' })
      .expect(200);

    expect(response.body.message).toBe('Open house updated successfully');
    expect(response.body.openHouse.startTime).toBe('11:00');
    expect(response.body.openHouse.endTime).toBe('13:00');
    expect(response.body.openHouse.notes).toBe('Updated notes');
  });

  test('should deny update of another agent\'s open house', async () => {
    const listing = await createTestListing(agent2._id);
    const oh = await createTestOpenHouse(listing._id, agent2._id);

    const response = await request(app)
      .put(`/api/open-houses/${oh._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ notes: 'Trying to update' })
      .expect(403);

    expect(response.body.error).toBe('Access denied');
    expect(response.body.message).toContain('your own listings');
  });

  test('should return 400 for empty request body', async () => {
    const listing = await createTestListing(agent1._id);
    const oh = await createTestOpenHouse(listing._id, agent1._id);

    const response = await request(app)
      .put(`/api/open-houses/${oh._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 400 for invalid time format', async () => {
    const listing = await createTestListing(agent1._id);
    const oh = await createTestOpenHouse(listing._id, agent1._id);

    const response = await request(app)
      .put(`/api/open-houses/${oh._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ startTime: 'bad-time' })
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 404 for non-existent open house', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .put(`/api/open-houses/${nonExistentId}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ notes: 'Update attempt' })
      .expect(404);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 400 for invalid ID format', async () => {
    const response = await request(app)
      .put('/api/open-houses/not-valid-id')
      .set('Authorization', `Bearer ${token1}`)
      .send({ notes: 'Update attempt' })
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 401 without auth token', async () => {
    const listing = await createTestListing(agent1._id);
    const oh = await createTestOpenHouse(listing._id, agent1._id);

    await request(app)
      .put(`/api/open-houses/${oh._id}`)
      .send({ notes: 'Update attempt' })
      .expect(401);
  });
});

// ─── DELETE /api/open-houses/:id ─────────────────────────────────────────────

describe('DELETE /api/open-houses/:id', () => {
  test('should delete an open house owned by the agent', async () => {
    const listing = await createTestListing(agent1._id);
    const oh = await createTestOpenHouse(listing._id, agent1._id);

    const response = await request(app)
      .delete(`/api/open-houses/${oh._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(response.body.message).toBe('Open house deleted successfully');

    const deleted = await OpenHouse.findById(oh._id);
    expect(deleted).toBeNull();
  });

  test('should deny deletion of another agent\'s open house', async () => {
    const listing = await createTestListing(agent2._id);
    const oh = await createTestOpenHouse(listing._id, agent2._id);

    const response = await request(app)
      .delete(`/api/open-houses/${oh._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(403);

    expect(response.body.error).toBe('Access denied');
    expect(response.body.message).toContain('your own listings');
  });

  test('should return 404 for non-existent open house', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .delete(`/api/open-houses/${nonExistentId}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(404);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 400 for invalid ID format', async () => {
    const response = await request(app)
      .delete('/api/open-houses/not-valid-id')
      .set('Authorization', `Bearer ${token1}`)
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 401 without auth token', async () => {
    const listing = await createTestListing(agent1._id);
    const oh = await createTestOpenHouse(listing._id, agent1._id);

    await request(app)
      .delete(`/api/open-houses/${oh._id}`)
      .expect(401);
  });
});
