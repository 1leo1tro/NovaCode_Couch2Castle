import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Agent from '../models/Agent.js';
import Listing from '../models/Listing.js';

process.env.JWT_SECRET = 'test-jwt-secret-reports-suite';

let mongoServer;
let agentUser;
let managerUser;
let adminUser;
let agentToken;
let managerToken;
let adminToken;

const generateToken = (agentId) =>
  jwt.sign({ id: agentId }, process.env.JWT_SECRET, { expiresIn: '1h' });

const createTestAgent = (overrides = {}) =>
  Agent.create({
    name: 'Test Agent',
    email: 'agent@test.com',
    password: 'password123',
    role: 'agent',
    isActive: true,
    ...overrides
  });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  agentUser = await createTestAgent({ email: 'agent-user@test.com', role: 'agent' });
  managerUser = await createTestAgent({ email: 'manager-user@test.com', role: 'manager' });
  adminUser = await createTestAgent({ email: 'admin-user@test.com', role: 'admin' });

  await Listing.create({
    price: 300000,
    address: '100 Role Test St, Huntsville, AL',
    squareFeet: 1800,
    status: 'active',
    zipCode: '35801',
    createdBy: managerUser._id
  });

  await Listing.create({
    price: 450000,
    address: '200 Role Test Ave, Huntsville, AL',
    squareFeet: 2200,
    status: 'sold',
    zipCode: '35802',
    createdBy: adminUser._id
  });

  agentToken = generateToken(agentUser._id);
  managerToken = generateToken(managerUser._id);
  adminToken = generateToken(adminUser._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Report route role authorization', () => {
  test('should return 403 for role agent on open report', async () => {
    await request(app)
      .get('/api/reports/open')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(403);
  });

  test('should return 403 for role agent on closed report', async () => {
    await request(app)
      .get('/api/reports/closed')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(403);
  });

  test('should allow role manager on open report', async () => {
    const response = await request(app)
      .get('/api/reports/open')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('should allow role manager on closed report', async () => {
    const response = await request(app)
      .get('/api/reports/closed')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('should allow role admin on open report', async () => {
    const response = await request(app)
      .get('/api/reports/open')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('should allow role admin on closed report', async () => {
    const response = await request(app)
      .get('/api/reports/closed')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('should treat missing role as agent and return 403', async () => {
    const legacyUser = await createTestAgent({ email: 'legacy-user@test.com' });

    await Agent.updateOne(
      { _id: legacyUser._id },
      { $unset: { role: '' } }
    );

    const legacyToken = generateToken(legacyUser._id);

    await request(app)
      .get('/api/reports/open')
      .set('Authorization', `Bearer ${legacyToken}`)
      .expect(403);
  });
});
