import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import app from '../app.js';
import Agent from '../models/Agent.js';

// Set test JWT secret before any auth middleware runs
process.env.JWT_SECRET = 'test-jwt-secret-availability-suite';

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

const validSlots = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
  { dayOfWeek: 3, startTime: '13:00', endTime: '17:00' },
  { dayOfWeek: 6, startTime: '10:00', endTime: '14:00' }
];

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
  // Reset availability slots to empty before each test
  await Agent.updateMany({}, { availabilitySlots: [] });
});

// ─── PUT /api/agents/me/availability ─────────────────────────────────────────

describe('PUT /api/agents/me/availability', () => {
  test('should update availability slots for the authenticated agent', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: validSlots })
      .expect(200);

    expect(response.body.message).toBe('Availability slots updated successfully');
    expect(response.body.agent).toBeDefined();
    expect(response.body.agent.availabilitySlots).toHaveLength(3);
  });

  test('should persist the correct slot data', async () => {
    await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: validSlots })
      .expect(200);

    const updated = await Agent.findById(agent1._id);
    expect(updated.availabilitySlots[0].dayOfWeek).toBe(1);
    expect(updated.availabilitySlots[0].startTime).toBe('09:00');
    expect(updated.availabilitySlots[0].endTime).toBe('12:00');
  });

  test('should not expose password in response', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: validSlots })
      .expect(200);

    expect(response.body.agent).not.toHaveProperty('password');
  });

  test('should accept an empty array to clear all slots', async () => {
    // First set some slots
    await Agent.findByIdAndUpdate(agent1._id, { availabilitySlots: validSlots });

    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: [] })
      .expect(200);

    expect(response.body.agent.availabilitySlots).toHaveLength(0);
  });

  test('should accept Sunday (dayOfWeek: 0)', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: [{ dayOfWeek: 0, startTime: '10:00', endTime: '12:00' }] })
      .expect(200);

    expect(response.body.agent.availabilitySlots[0].dayOfWeek).toBe(0);
  });

  test('should accept Saturday (dayOfWeek: 6)', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: [{ dayOfWeek: 6, startTime: '10:00', endTime: '12:00' }] })
      .expect(200);

    expect(response.body.agent.availabilitySlots[0].dayOfWeek).toBe(6);
  });

  test('should only update the requesting agent\'s slots, not other agents', async () => {
    await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: validSlots })
      .expect(200);

    const agent2Data = await Agent.findById(agent2._id);
    expect(agent2Data.availabilitySlots).toHaveLength(0);
  });

  test('should return 400 when availabilitySlots is not an array', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: 'not-an-array' })
      .expect(400);

    expect(response.body.message).toBe('Invalid input');
    expect(response.body.error).toContain('array');
  });

  test('should return 400 when availabilitySlots is missing from body', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({})
      .expect(400);

    expect(response.body.message).toBe('Invalid input');
  });

  test('should return 400 when dayOfWeek is missing from a slot', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: [{ startTime: '09:00', endTime: '12:00' }] })
      .expect(400);

    expect(response.body.message).toBe('Invalid input');
    expect(response.body.error).toContain('dayOfWeek');
  });

  test('should return 400 when dayOfWeek is out of range (> 6)', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: [{ dayOfWeek: 7, startTime: '09:00', endTime: '12:00' }] })
      .expect(400);

    expect(response.body.message).toBe('Invalid input');
    expect(response.body.error).toContain('0 and 6');
  });

  test('should return 400 when dayOfWeek is out of range (< 0)', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: [{ dayOfWeek: -1, startTime: '09:00', endTime: '12:00' }] })
      .expect(400);

    expect(response.body.message).toBe('Invalid input');
    expect(response.body.error).toContain('0 and 6');
  });

  test('should return 400 when startTime is missing', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: [{ dayOfWeek: 1, endTime: '12:00' }] })
      .expect(400);

    expect(response.body.message).toBe('Invalid input');
    expect(response.body.error).toContain('startTime');
  });

  test('should return 400 when endTime is missing', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: [{ dayOfWeek: 1, startTime: '09:00' }] })
      .expect(400);

    expect(response.body.message).toBe('Invalid input');
    expect(response.body.error).toContain('endTime');
  });

  test('should return 400 for invalid startTime format', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: [{ dayOfWeek: 1, startTime: '9am', endTime: '12:00' }] })
      .expect(400);

    expect(response.body.message).toBe('Invalid input');
    expect(response.body.error).toContain('HH:MM');
  });

  test('should return 400 for invalid endTime format', async () => {
    const response = await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '5pm' }] })
      .expect(400);

    expect(response.body.message).toBe('Invalid input');
    expect(response.body.error).toContain('HH:MM');
  });

  test('should return 401 without auth token', async () => {
    await request(app)
      .put('/api/agents/me/availability')
      .send({ availabilitySlots: validSlots })
      .expect(401);
  });
});

// ─── GET /api/agents/me/availability ─────────────────────────────────────────

describe('GET /api/agents/me/availability', () => {
  test('should return empty array when no slots are set', async () => {
    const response = await request(app)
      .get('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(response.body.availabilitySlots).toBeDefined();
    expect(Array.isArray(response.body.availabilitySlots)).toBe(true);
    expect(response.body.availabilitySlots).toHaveLength(0);
  });

  test('should return the agent\'s availability slots', async () => {
    await Agent.findByIdAndUpdate(agent1._id, { availabilitySlots: validSlots });

    const response = await request(app)
      .get('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(response.body.availabilitySlots).toHaveLength(3);
    expect(response.body.availabilitySlots[0].dayOfWeek).toBe(1);
    expect(response.body.availabilitySlots[0].startTime).toBe('09:00');
    expect(response.body.availabilitySlots[0].endTime).toBe('12:00');
  });

  test('should only return the requesting agent\'s slots', async () => {
    await Agent.findByIdAndUpdate(agent1._id, { availabilitySlots: validSlots });
    // agent2 has no slots

    const response = await request(app)
      .get('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token2}`)
      .expect(200);

    expect(response.body.availabilitySlots).toHaveLength(0);
  });

  test('should reflect updated slots after PUT', async () => {
    await request(app)
      .put('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .send({ availabilitySlots: [{ dayOfWeek: 2, startTime: '08:00', endTime: '10:00' }] });

    const response = await request(app)
      .get('/api/agents/me/availability')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(response.body.availabilitySlots).toHaveLength(1);
    expect(response.body.availabilitySlots[0].dayOfWeek).toBe(2);
  });

  test('should return 401 without auth token', async () => {
    await request(app)
      .get('/api/agents/me/availability')
      .expect(401);
  });
});
