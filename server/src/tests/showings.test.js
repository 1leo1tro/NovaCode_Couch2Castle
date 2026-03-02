import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Showing from '../models/Showing.js';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';

// Set test JWT secret before any auth middleware runs
process.env.JWT_SECRET = 'test-jwt-secret-showings-suite';

let mongoServer;
// Agents are created once (beforeAll) to avoid repeated bcrypt overhead
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

const createTestShowing = (listingId, overrides = {}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return Showing.create({
    listing: listingId,
    name: 'John Visitor',
    email: 'visitor@example.com',
    phone: '555-123-4567',
    preferredDate: tomorrow,
    status: 'pending',
    ...overrides
  });
};

// ─── Lifecycle ──────────────────────────────────────────────────────────────

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create two agents once — bcrypt hashing is expensive so we reuse them
  agent1 = await createTestAgent({ email: 'agent1@test.com' });
  agent2 = await createTestAgent({ email: 'agent2@test.com' });
  token1 = generateToken(agent1._id);
  token2 = generateToken(agent2._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear only transient data (showings and listings) between tests;
// agents persist for the entire suite to avoid repeated bcrypt hashing.
beforeEach(async () => {
  await Showing.deleteMany({});
  await Listing.deleteMany({});
});

// ============================================================
// POST /api/showings — Create Showing Request (PUBLIC)
// ============================================================

describe('POST /api/showings', () => {
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

  // ── Valid Requests ─────────────────────────────────────────

  describe('Valid Requests', () => {
    test('should create a showing request and return 201', async () => {
      const response = await request(app)
        .post('/api/showings')
        .send(validBody)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.message).toBe('Showing request submitted successfully');
      expect(response.body.showing).toBeDefined();
      expect(response.body.showing.name).toBe('Jane Smith');
      expect(response.body.showing.email).toBe('jane@example.com');
    });

    test('should default showing status to pending', async () => {
      const response = await request(app)
        .post('/api/showings')
        .send(validBody)
        .expect(201);

      expect(response.body.showing.status).toBe('pending');
    });

    test('should create a showing with an optional message', async () => {
      const response = await request(app)
        .post('/api/showings')
        .send({ ...validBody, message: 'I am very interested in this property.' })
        .expect(201);

      expect(response.body.showing.message).toBe('I am very interested in this property.');
    });

    test('should populate listing details in the response', async () => {
      const response = await request(app)
        .post('/api/showings')
        .send(validBody)
        .expect(201);

      const { listing: populatedListing } = response.body.showing;
      expect(populatedListing).toHaveProperty('address');
      expect(populatedListing).toHaveProperty('zipCode');
      expect(populatedListing).toHaveProperty('price');
    });

    test('should not require authentication to create a showing', async () => {
      // Deliberately send no Authorization header
      const response = await request(app)
        .post('/api/showings')
        .send(validBody)
        .expect(201);

      expect(response.body.showing).toBeDefined();
    });
  });

  // ── Required Field Validation ──────────────────────────────

  describe('Required Field Validation', () => {
    test('should return 400 when listing field is missing', async () => {
      const { listing: _omit, ...bodyWithoutListing } = validBody;
      const response = await request(app)
        .post('/api/showings')
        .send(bodyWithoutListing)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 when name is missing', async () => {
      const { name: _omit, ...body } = validBody;
      const response = await request(app)
        .post('/api/showings')
        .send(body)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 when email is missing', async () => {
      const { email: _omit, ...body } = validBody;
      const response = await request(app)
        .post('/api/showings')
        .send(body)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 when phone is missing', async () => {
      const { phone: _omit, ...body } = validBody;
      const response = await request(app)
        .post('/api/showings')
        .send(body)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 when preferredDate is missing', async () => {
      const { preferredDate: _omit, ...body } = validBody;
      const response = await request(app)
        .post('/api/showings')
        .send(body)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Field Format Validation ────────────────────────────────

  describe('Field Format Validation', () => {
    test('should return 400 for an invalid email format', async () => {
      const response = await request(app)
        .post('/api/showings')
        .send({ ...validBody, email: 'not-an-email' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 for a phone number containing letters', async () => {
      const response = await request(app)
        .post('/api/showings')
        .send({ ...validBody, phone: 'abc-not-a-phone' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 when preferredDate is in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const response = await request(app)
        .post('/api/showings')
        .send({ ...validBody, preferredDate: yesterday.toISOString() })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 for a name shorter than 2 characters', async () => {
      const response = await request(app)
        .post('/api/showings')
        .send({ ...validBody, name: 'A' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 for a name longer than 100 characters', async () => {
      const response = await request(app)
        .post('/api/showings')
        .send({ ...validBody, name: 'A'.repeat(101) })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 for a message exceeding 1000 characters', async () => {
      const response = await request(app)
        .post('/api/showings')
        .send({ ...validBody, message: 'X'.repeat(1001) })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Listing Validation ─────────────────────────────────────

  describe('Listing Validation', () => {
    test('should return 400 for an invalid listing ID format', async () => {
      const response = await request(app)
        .post('/api/showings')
        .send({ ...validBody, listing: 'not-a-valid-id' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 404 for a valid ObjectId that does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/showings')
        .send({ ...validBody, listing: nonExistentId.toString() })
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Response Structure ─────────────────────────────────────

  describe('Response Structure', () => {
    test('should return the complete showing object with all expected fields', async () => {
      const response = await request(app)
        .post('/api/showings')
        .send(validBody)
        .expect(201);

      const { showing } = response.body;
      expect(showing).toHaveProperty('_id');
      expect(showing).toHaveProperty('listing');
      expect(showing).toHaveProperty('name');
      expect(showing).toHaveProperty('email');
      expect(showing).toHaveProperty('phone');
      expect(showing).toHaveProperty('preferredDate');
      expect(showing).toHaveProperty('status');
      expect(showing).toHaveProperty('createdAt');
      expect(showing).toHaveProperty('updatedAt');
    });
  });
});

// ============================================================
// GET /api/showings — Fetch Agent's Showing Requests (PROTECTED)
// ============================================================

describe('GET /api/showings', () => {
  let listing1; // owned by agent1
  let listing2; // also owned by agent1 (second listing)
  let listing3; // owned by agent2

  beforeEach(async () => {
    listing1 = await createTestListing(agent1._id, {
      address: '100 First St, Huntsville, AL',
      zipCode: '35801'
    });
    listing2 = await createTestListing(agent1._id, {
      address: '200 Second St, Huntsville, AL',
      zipCode: '35802'
    });
    listing3 = await createTestListing(agent2._id, {
      address: '300 Other St, Madison, AL',
      zipCode: '35758'
    });
  });

  // ── Authentication ─────────────────────────────────────────

  describe('Authentication', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/showings')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 401 when the token is invalid', async () => {
      const response = await request(app)
        .get('/api/showings')
        .set('Authorization', 'Bearer this.is.not.valid')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 200 with a valid token', async () => {
      const response = await request(app)
        .get('/api/showings')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body).toHaveProperty('showings');
    });
  });

  // ── Ownership Verification ─────────────────────────────────

  describe('Ownership Verification', () => {
    test('should only return showings for listings owned by the authenticated agent', async () => {
      // Two showings on agent1's listing, one on agent2's listing
      await createTestShowing(listing1._id, { name: 'Visitor A' });
      await createTestShowing(listing1._id, { name: 'Visitor B' });
      await createTestShowing(listing3._id, { name: 'Visitor C' }); // agent2's listing

      const response = await request(app)
        .get('/api/showings')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      // agent1 should only see 2, not the one on agent2's listing
      expect(response.body.showings).toHaveLength(2);
      expect(response.body.count).toBe(2);
      response.body.showings.forEach((s) => {
        expect(['Visitor A', 'Visitor B']).toContain(s.name);
      });
    });

    test('should return an empty list with a message for an agent with no listings', async () => {
      // agent1 has listings but token3 belongs to a temporary agent with none
      const tempAgent = await createTestAgent({ email: 'temp@test.com' });
      const tempToken = generateToken(tempAgent._id);

      const response = await request(app)
        .get('/api/showings')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(200);

      expect(response.body.showings).toHaveLength(0);
      expect(response.body.count).toBe(0);
      expect(response.body.message).toBe('No listings found for this agent');

      // Clean up the temporary agent
      await Agent.findByIdAndDelete(tempAgent._id);
    });
  });

  // ── Filtering by Status ────────────────────────────────────

  describe('Filtering by Status', () => {
    beforeEach(async () => {
      await createTestShowing(listing1._id, { name: 'Pending 1', status: 'pending' });
      await createTestShowing(listing1._id, { name: 'Pending 2', status: 'pending' });
      await createTestShowing(listing1._id, { name: 'Confirmed 1', status: 'confirmed' });
      await createTestShowing(listing1._id, { name: 'Cancelled 1', status: 'cancelled' });
      await createTestShowing(listing1._id, { name: 'Completed 1', status: 'completed' });
    });

    test('should return only pending showings when status=pending', async () => {
      const response = await request(app)
        .get('/api/showings?status=pending')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.showings).toHaveLength(2);
      response.body.showings.forEach((s) => expect(s.status).toBe('pending'));
    });

    test('should return only confirmed showings when status=confirmed', async () => {
      const response = await request(app)
        .get('/api/showings?status=confirmed')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.showings).toHaveLength(1);
      expect(response.body.showings[0].status).toBe('confirmed');
    });

    test('should return only cancelled showings when status=cancelled', async () => {
      const response = await request(app)
        .get('/api/showings?status=cancelled')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.showings).toHaveLength(1);
      expect(response.body.showings[0].status).toBe('cancelled');
    });

    test('should return only completed showings when status=completed', async () => {
      const response = await request(app)
        .get('/api/showings?status=completed')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.showings).toHaveLength(1);
      expect(response.body.showings[0].status).toBe('completed');
    });

    test('should return 400 for an unrecognised status value', async () => {
      const response = await request(app)
        .get('/api/showings?status=rejected')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid status');
      expect(response.body.message).toContain('pending, confirmed, completed, cancelled');
    });

    test('should return all showings when no status filter is applied', async () => {
      const response = await request(app)
        .get('/api/showings')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.showings).toHaveLength(5);
    });
  });

  // ── Filtering by Listing ID ────────────────────────────────

  describe('Filtering by Listing ID', () => {
    beforeEach(async () => {
      await createTestShowing(listing1._id, { name: 'Visitor for Listing 1' });
      await createTestShowing(listing2._id, { name: 'Visitor for Listing 2' });
    });

    test('should return only showings for the specified listing', async () => {
      const response = await request(app)
        .get(`/api/showings?listingId=${listing1._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.showings).toHaveLength(1);
      expect(response.body.showings[0].name).toBe('Visitor for Listing 1');
    });

    test('should return 403 when filtering by another agent\'s listing', async () => {
      // token1 (agent1) tries to view showings for listing3 (agent2's listing)
      const response = await request(app)
        .get(`/api/showings?listingId=${listing3._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toContain('your own listings');
    });

    test('should return 404 for a valid ObjectId listing that does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/showings?listingId=${nonExistentId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 for an invalid listing ID format', async () => {
      const response = await request(app)
        .get('/api/showings?listingId=not-a-valid-id')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Pagination ─────────────────────────────────────────────

  describe('Pagination', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 5; i++) {
        await createTestShowing(listing1._id, {
          name: `Visitor ${i}`,
          email: `visitor${i}@example.com`
        });
      }
    });

    test('should return paginated results with page and limit params', async () => {
      const response = await request(app)
        .get('/api/showings?page=1&limit=3')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.showings).toHaveLength(3);
      expect(response.body.count).toBe(5);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });

    test('should return correct results for the second page', async () => {
      const response = await request(app)
        .get('/api/showings?page=2&limit=3')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.showings).toHaveLength(2);
      expect(response.body.page).toBe(2);
    });
  });

  // ── Response Structure ─────────────────────────────────────

  describe('Response Structure', () => {
    test('should return the correct top-level response shape', async () => {
      await createTestShowing(listing1._id);

      const response = await request(app)
        .get('/api/showings')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body).toHaveProperty('showings');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.showings)).toBe(true);
    });

    test('should populate listing information on each showing', async () => {
      await createTestShowing(listing1._id);

      const response = await request(app)
        .get('/api/showings')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const showing = response.body.showings[0];
      expect(showing.listing).toHaveProperty('address');
      expect(showing.listing).toHaveProperty('zipCode');
      expect(showing.listing).toHaveProperty('price');
    });

    test('should return showings sorted by createdAt descending (newest first)', async () => {
      const base = Date.now();
      await createTestShowing(listing1._id, {
        name: 'Oldest',
        createdAt: new Date(base - 2000)
      });
      await createTestShowing(listing1._id, {
        name: 'Middle',
        createdAt: new Date(base - 1000)
      });
      await createTestShowing(listing1._id, {
        name: 'Newest',
        createdAt: new Date(base)
      });

      const response = await request(app)
        .get('/api/showings')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.showings[0].name).toBe('Newest');
      expect(response.body.showings[2].name).toBe('Oldest');
    });
  });

  // ── Empty Results ──────────────────────────────────────────

  describe('Empty Results', () => {
    test('should return an empty array with a message when no showings match the filter', async () => {
      // listing1 exists but has no showings
      const response = await request(app)
        .get('/api/showings?status=completed')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.showings).toHaveLength(0);
      expect(response.body.count).toBe(0);
      expect(response.body.message).toBe('No showing requests found');
    });
  });
});

// ============================================================
// PATCH /api/showings/:id — Approve / Reject Showing (PROTECTED)
// ============================================================

describe('PATCH /api/showings/:id', () => {
  let listing1; // owned by agent1
  let listing3; // owned by agent2
  let showing;  // pending showing on listing1

  beforeEach(async () => {
    listing1 = await createTestListing(agent1._id);
    listing3 = await createTestListing(agent2._id, {
      address: '999 Other Rd, Madison, AL',
      zipCode: '35758'
    });
    showing = await createTestShowing(listing1._id);
  });

  // ── Authentication ─────────────────────────────────────────

  describe('Authentication', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .patch(`/api/showings/${showing._id}`)
        .send({ status: 'confirmed' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 401 when the token is invalid', async () => {
      const response = await request(app)
        .patch(`/api/showings/${showing._id}`)
        .set('Authorization', 'Bearer bad.token.value')
        .send({ status: 'confirmed' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Valid Status Updates ───────────────────────────────────

  describe('Valid Status Updates', () => {
    test('should approve (confirm) a showing and return 200', async () => {
      const response = await request(app)
        .patch(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.message).toBe('Showing status updated successfully');
      expect(response.body.showing.status).toBe('confirmed');
    });

    test('should reject (cancel) a showing and return 200', async () => {
      const response = await request(app)
        .patch(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'cancelled' })
        .expect(200);

      expect(response.body.message).toBe('Showing status updated successfully');
      expect(response.body.showing.status).toBe('cancelled');
    });

    test('should mark a showing as completed', async () => {
      const response = await request(app)
        .patch(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.showing.status).toBe('completed');
    });

    test('should allow setting a showing back to pending', async () => {
      // First confirm it
      await request(app)
        .patch(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'confirmed' });

      // Then revert to pending
      const response = await request(app)
        .patch(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'pending' })
        .expect(200);

      expect(response.body.showing.status).toBe('pending');
    });
  });

  // ── Validation ─────────────────────────────────────────────

  describe('Validation', () => {
    test('should return 400 when status field is missing from the request body', async () => {
      const response = await request(app)
        .patch(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Invalid status');
    });

    test('should return 400 for an unrecognised status value', async () => {
      const response = await request(app)
        .patch(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'approved' })
        .expect(400);

      expect(response.body.error).toBe('Invalid status');
      expect(response.body.message).toContain('pending, confirmed, completed, cancelled');
    });

    test('should return 400 for an invalid showing ID format', async () => {
      const response = await request(app)
        .patch('/api/showings/not-a-valid-id')
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'confirmed' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 404 for a valid ObjectId that does not match any showing', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/showings/${nonExistentId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'confirmed' })
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Authorization — Ownership Verification ─────────────────

  describe('Authorization - Ownership Verification', () => {
    test('should return 403 when an agent tries to update a showing on another agent\'s listing', async () => {
      // Create a showing on agent2's listing
      const otherShowing = await createTestShowing(listing3._id);

      // agent1 (token1) should be denied
      const response = await request(app)
        .patch(`/api/showings/${otherShowing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'confirmed' })
        .expect(403);

      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toContain('your own listings');
    });

    test('should allow the listing owner to update a showing status', async () => {
      const response = await request(app)
        .patch(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.showing.status).toBe('confirmed');
    });
  });

  // ── Response Structure ─────────────────────────────────────

  describe('Response Structure', () => {
    test('should return the updated showing with populated listing information', async () => {
      const response = await request(app)
        .patch(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'confirmed' })
        .expect(200);

      const { showing: updated } = response.body;
      expect(updated).toHaveProperty('_id');
      expect(updated).toHaveProperty('status', 'confirmed');
      expect(updated.listing).toHaveProperty('address');
      expect(updated.listing).toHaveProperty('zipCode');
      expect(updated.listing).toHaveProperty('price');
    });
  });
});

// ============================================================
// GET /api/showings/:id — Fetch Single Showing (PUBLIC)
// ============================================================

describe('GET /api/showings/:id', () => {
  let listing;
  let showing;

  beforeEach(async () => {
    listing = await createTestListing(agent1._id);
    showing = await createTestShowing(listing._id, { name: 'Solo Visitor' });
  });

  // ── Valid Requests ─────────────────────────────────────────

  describe('Valid Requests', () => {
    test('should return 200 with the showing for a valid ID', async () => {
      const response = await request(app)
        .get(`/api/showings/${showing._id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('showing');
      expect(response.body.showing._id).toBe(showing._id.toString());
      expect(response.body.showing.name).toBe('Solo Visitor');
    });

    test('should not require authentication to fetch a showing by ID', async () => {
      // No Authorization header
      const response = await request(app)
        .get(`/api/showings/${showing._id}`)
        .expect(200);

      expect(response.body.showing).toBeDefined();
    });

    test('should populate listing information in the response', async () => {
      const response = await request(app)
        .get(`/api/showings/${showing._id}`)
        .expect(200);

      const { listing: populatedListing } = response.body.showing;
      expect(populatedListing).toHaveProperty('address');
      expect(populatedListing).toHaveProperty('zipCode');
      expect(populatedListing).toHaveProperty('price');
    });

    test('should return the complete showing object with all expected fields', async () => {
      const response = await request(app)
        .get(`/api/showings/${showing._id}`)
        .expect(200);

      const { showing: s } = response.body;
      expect(s).toHaveProperty('_id');
      expect(s).toHaveProperty('listing');
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('email');
      expect(s).toHaveProperty('phone');
      expect(s).toHaveProperty('preferredDate');
      expect(s).toHaveProperty('status');
      expect(s).toHaveProperty('createdAt');
      expect(s).toHaveProperty('updatedAt');
    });
  });

  // ── Validation ─────────────────────────────────────────────

  describe('Validation', () => {
    test('should return 400 for an invalid showing ID format', async () => {
      const response = await request(app)
        .get('/api/showings/not-a-valid-id')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 404 for a valid ObjectId that does not match any showing', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/showings/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});

// ============================================================
// GET /api/showings/count/pending — Pending Count (PROTECTED)
// ============================================================

describe('GET /api/showings/count/pending', () => {
  let listing1;
  let listing3; // owned by agent2

  beforeEach(async () => {
    listing1 = await createTestListing(agent1._id, {
      address: '10 Count Ave, Huntsville, AL',
      zipCode: '35801'
    });
    listing3 = await createTestListing(agent2._id, {
      address: '20 Other Ave, Madison, AL',
      zipCode: '35758'
    });
  });

  // ── Authentication ─────────────────────────────────────────

  describe('Authentication', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/showings/count/pending')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 401 when the token is invalid', async () => {
      const response = await request(app)
        .get('/api/showings/count/pending')
        .set('Authorization', 'Bearer bad.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Correct Count ──────────────────────────────────────────

  describe('Correct Count', () => {
    test('should return 0 when agent has no listings', async () => {
      const tempAgent = await createTestAgent({ email: 'nolistings@test.com' });
      const tempToken = generateToken(tempAgent._id);

      const response = await request(app)
        .get('/api/showings/count/pending')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('count', 0);
      await Agent.findByIdAndDelete(tempAgent._id);
    });

    test('should return 0 when agent has listings but no pending showings', async () => {
      // Create a confirmed showing — should not count
      await createTestShowing(listing1._id, { status: 'confirmed' });

      const response = await request(app)
        .get('/api/showings/count/pending')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body).toHaveProperty('count', 0);
    });

    test('should return the correct count of pending showings', async () => {
      await createTestShowing(listing1._id, { name: 'Pending A', status: 'pending' });
      await createTestShowing(listing1._id, { name: 'Pending B', status: 'pending' });
      await createTestShowing(listing1._id, { name: 'Confirmed', status: 'confirmed' });

      const response = await request(app)
        .get('/api/showings/count/pending')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body).toHaveProperty('count', 2);
    });

    test('should only count pending showings for the authenticated agent\'s own listings', async () => {
      // Two pending showings on agent1's listing, one on agent2's listing
      await createTestShowing(listing1._id, { status: 'pending' });
      await createTestShowing(listing1._id, { status: 'pending' });
      await createTestShowing(listing3._id, { status: 'pending' }); // agent2's listing

      const response = await request(app)
        .get('/api/showings/count/pending')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      // agent1 should only see their own 2, not agent2's
      expect(response.body.count).toBe(2);
    });

    test('should return 200 with a count property in the response', async () => {
      const response = await request(app)
        .get('/api/showings/count/pending')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
    });
  });
});

// ============================================================
// DELETE /api/showings/:id — Delete Showing (PROTECTED)
// ============================================================

describe('DELETE /api/showings/:id', () => {
  let listing1; // owned by agent1
  let listing3; // owned by agent2
  let showing;  // pending showing on listing1

  beforeEach(async () => {
    listing1 = await createTestListing(agent1._id);
    listing3 = await createTestListing(agent2._id, {
      address: '777 Other Dr, Madison, AL',
      zipCode: '35758'
    });
    showing = await createTestShowing(listing1._id, { name: 'Delete Target' });
  });

  // ── Authentication ─────────────────────────────────────────

  describe('Authentication', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .delete(`/api/showings/${showing._id}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 401 when the token is invalid', async () => {
      const response = await request(app)
        .delete(`/api/showings/${showing._id}`)
        .set('Authorization', 'Bearer invalid.token.value')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Valid Deletion ─────────────────────────────────────────

  describe('Valid Deletion', () => {
    test('should delete the showing and return 200', async () => {
      const response = await request(app)
        .delete(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.message).toBe('Showing deleted successfully');
    });

    test('should actually remove the showing from the database', async () => {
      await request(app)
        .delete(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const deleted = await Showing.findById(showing._id);
      expect(deleted).toBeNull();
    });

    test('should return the deleted showing\'s basic info in the response', async () => {
      const response = await request(app)
        .delete(`/api/showings/${showing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const { showing: deleted } = response.body;
      expect(deleted).toHaveProperty('_id');
      expect(deleted).toHaveProperty('name', 'Delete Target');
      expect(deleted).toHaveProperty('email');
    });
  });

  // ── Validation ─────────────────────────────────────────────

  describe('Validation', () => {
    test('should return 400 for an invalid showing ID format', async () => {
      const response = await request(app)
        .delete('/api/showings/not-a-valid-id')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 404 for a valid ObjectId that does not match any showing', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/showings/${nonExistentId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  // ── Authorization – Ownership Verification ─────────────────

  describe('Authorization - Ownership Verification', () => {
    test('should return 403 when an agent tries to delete a showing on another agent\'s listing', async () => {
      const otherShowing = await createTestShowing(listing3._id, { name: 'Protected Visitor' });

      // agent1 (token1) attempts to delete a showing on agent2's listing
      const response = await request(app)
        .delete(`/api/showings/${otherShowing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toContain('your own listings');
    });

    test('should not delete the showing when access is denied', async () => {
      const otherShowing = await createTestShowing(listing3._id);

      await request(app)
        .delete(`/api/showings/${otherShowing._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(403);

      // Showing must still exist
      const stillExists = await Showing.findById(otherShowing._id);
      expect(stillExists).not.toBeNull();
    });

    test('should allow the listing owner (agent2) to delete their own showing', async () => {
      const ownShowing = await createTestShowing(listing3._id, { name: 'Agent2 Visitor' });

      const response = await request(app)
        .delete(`/api/showings/${ownShowing._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.message).toBe('Showing deleted successfully');
    });
  });
});
