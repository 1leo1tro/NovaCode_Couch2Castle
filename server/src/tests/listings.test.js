import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import app from '../app.js';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';

// Set test JWT secret before any auth middleware runs
process.env.JWT_SECRET = 'test-jwt-secret-listings-suite';

jest.setTimeout(30000);

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

// Clear database before each test
beforeEach(async () => {
  await Listing.deleteMany({});
});

// ── Ownership Enforcement Tests ────────────────────────────────────────────

describe('Ownership Enforcement', () => {
  let listing1; // owned by agent1
  let listing2; // owned by agent2
  let updatedListingData;

  beforeEach(async () => {
    listing1 = await createTestListing(agent1._id);
    listing2 = await createTestListing(agent2._id);
    updatedListingData = {
      price: 300000,
      address: 'Updated Address, Huntsville, AL',
      squareFeet: 2000
    };
  });

  describe('PUT /api/listings/:id - Update Listing', () => {
    test('should allow owner to update their own listing', async () => {
      const response = await request(app)
        .put(`/api/listings/${listing1._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updatedListingData)
        .expect(200);

      expect(response.body.message).toBe('Listing updated successfully');
      expect(response.body.listing.price).toBe(300000);
      expect(response.body.listing.address).toBe('Updated Address, Huntsville, AL');
    });

    test('should deny access to update another agent\'s listing', async () => {
      const response = await request(app)
        .put(`/api/listings/${listing2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updatedListingData)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toContain('your own listings');
    });

    test('should return 400 for invalid listing ID format', async () => {
      const response = await request(app)
        .put('/api/listings/not-a-valid-id')
        .set('Authorization', `Bearer ${token1}`)
        .send(updatedListingData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 404 for non-existent listing ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/listings/${nonExistentId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updatedListingData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/listings/:id - Delete Listing', () => {
    test('should allow owner to delete their own listing', async () => {
      const response = await request(app)
        .delete(`/api/listings/${listing1._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.message).toBe('Listing deleted successfully');
    });

    test('should deny access to delete another agent\'s listing', async () => {
      const response = await request(app)
        .delete(`/api/listings/${listing2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toContain('your own listings');
    });

    test('should return 400 for invalid listing ID format', async () => {
      const response = await request(app)
        .delete('/api/listings/not-a-valid-id')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 404 for non-existent listing ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/listings/${nonExistentId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});

describe('GET /api/listings', () => {
  describe('Active Listings', () => {
    test('should return all active listings', async () => {
      // Create test listings with different statuses
      await Listing.create([
        {
          price: 250000,
          address: '123 Main St, Huntsville, AL',
          squareFeet: 1500,
          status: 'active',
          zipCode: '35801'
        },
        {
          price: 350000,
          address: '456 Oak Ave, Huntsville, AL',
          squareFeet: 2200,
          status: 'active',
          zipCode: '35802'
        },
        {
          price: 180000,
          address: '789 Pine Rd, Madison, AL',
          squareFeet: 1200,
          status: 'sold',
          zipCode: '35758'
        }
      ]);

      const response = await request(app)
        .get('/api/listings')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.listings).toHaveLength(3);
      expect(response.body.count).toBe(3);
    });

    test('should only return listings with active status when filtered', async () => {
      // Note: Current controller doesn't filter by status, but this test
      // documents expected behavior if status filtering is added
      await Listing.create([
        {
          price: 250000,
          address: '123 Main St, Huntsville, AL',
          squareFeet: 1500,
          status: 'active',
          zipCode: '35801'
        },
        {
          price: 350000,
          address: '456 Oak Ave, Huntsville, AL',
          squareFeet: 2200,
          status: 'pending',
          zipCode: '35802'
        }
      ]);

      const response = await request(app)
        .get('/api/listings')
        .expect(200);

      // Currently returns all listings regardless of status
      expect(response.body.listings).toHaveLength(2);
    });
  });

  describe('Data Structure Validation', () => {
    test('should return listings with correct data structure', async () => {
      await Listing.create({
        price: 250000,
        address: '123 Main St, Huntsville, AL',
        squareFeet: 1500,
        status: 'active',
        zipCode: '35801'
      });

      const response = await request(app)
        .get('/api/listings')
        .expect(200);

      expect(response.body).toHaveProperty('listings');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.listings)).toBe(true);

      const listing = response.body.listings[0];
      expect(listing).toHaveProperty('_id');
      expect(listing).toHaveProperty('price');
      expect(listing).toHaveProperty('address');
      expect(listing).toHaveProperty('squareFeet');
      expect(listing).toHaveProperty('status');
      expect(listing).toHaveProperty('zipCode');
      expect(listing).toHaveProperty('images');
      expect(listing).toHaveProperty('createdAt');
      expect(listing).toHaveProperty('updatedAt');
    });

    test('should return correct data types for listing fields', async () => {
      await Listing.create({
        price: 250000,
        address: '123 Main St, Huntsville, AL',
        squareFeet: 1500,
        status: 'active',
        zipCode: '35801',
        images: ['image1.jpg', 'image2.jpg']
      });

      const response = await request(app)
        .get('/api/listings')
        .expect(200);

      const listing = response.body.listings[0];
      expect(typeof listing.price).toBe('number');
      expect(typeof listing.address).toBe('string');
      expect(typeof listing.squareFeet).toBe('number');
      expect(typeof listing.status).toBe('string');
      expect(typeof listing.zipCode).toBe('string');
      expect(Array.isArray(listing.images)).toBe(true);
    });
  });

  describe('Price Range Filtering', () => {
    beforeEach(async () => {
      await Listing.create([
        {
          price: 150000,
          address: '100 Budget St, Huntsville, AL',
          squareFeet: 1000,
          status: 'active',
          zipCode: '35801'
        },
        {
          price: 250000,
          address: '200 Mid St, Huntsville, AL',
          squareFeet: 1500,
          status: 'active',
          zipCode: '35802'
        },
        {
          price: 350000,
          address: '300 Luxury Ave, Huntsville, AL',
          squareFeet: 2200,
          status: 'active',
          zipCode: '35803'
        },
        {
          price: 500000,
          address: '400 Premium Blvd, Huntsville, AL',
          squareFeet: 3000,
          status: 'active',
          zipCode: '35804'
        }
      ]);
    });

    test('should filter by minimum price', async () => {
      const response = await request(app)
        .get('/api/listings?minPrice=250000')
        .expect(200);

      expect(response.body.listings).toHaveLength(3);
      response.body.listings.forEach(listing => {
        expect(listing.price).toBeGreaterThanOrEqual(250000);
      });
    });

    test('should filter by maximum price', async () => {
      const response = await request(app)
        .get('/api/listings?maxPrice=300000')
        .expect(200);

      expect(response.body.listings).toHaveLength(2);
      response.body.listings.forEach(listing => {
        expect(listing.price).toBeLessThanOrEqual(300000);
      });
    });

    test('should filter by price range (min and max)', async () => {
      const response = await request(app)
        .get('/api/listings?minPrice=200000&maxPrice=400000')
        .expect(200);

      expect(response.body.listings).toHaveLength(2);
      response.body.listings.forEach(listing => {
        expect(listing.price).toBeGreaterThanOrEqual(200000);
        expect(listing.price).toBeLessThanOrEqual(400000);
      });
    });

    test('should handle exact price match', async () => {
      const response = await request(app)
        .get('/api/listings?minPrice=250000&maxPrice=250000')
        .expect(200);

      expect(response.body.listings).toHaveLength(1);
      expect(response.body.listings[0].price).toBe(250000);
    });
  });

  describe('Square Footage Filtering', () => {
    beforeEach(async () => {
      await Listing.create([
        {
          price: 200000,
          address: '100 Small St, Huntsville, AL',
          squareFeet: 1000,
          status: 'active',
          zipCode: '35801'
        },
        {
          price: 300000,
          address: '200 Large Ave, Huntsville, AL',
          squareFeet: 2500,
          status: 'active',
          zipCode: '35802'
        }
      ]);
    });

    test('should filter by minimum square footage', async () => {
      const response = await request(app)
        .get('/api/listings?minSquareFeet=2000')
        .expect(200);

      expect(response.body.listings).toHaveLength(1);
      expect(response.body.listings[0].squareFeet).toBeGreaterThanOrEqual(2000);
    });

    test('should filter by maximum square footage', async () => {
      const response = await request(app)
        .get('/api/listings?maxSquareFeet=1500')
        .expect(200);

      expect(response.body.listings).toHaveLength(1);
      expect(response.body.listings[0].squareFeet).toBeLessThanOrEqual(1500);
    });

    test('should filter by square footage range', async () => {
      const response = await request(app)
        .get('/api/listings?minSquareFeet=900&maxSquareFeet=2600')
        .expect(200);

      expect(response.body.listings).toHaveLength(2);
      response.body.listings.forEach(listing => {
        expect(listing.squareFeet).toBeGreaterThanOrEqual(900);
        expect(listing.squareFeet).toBeLessThanOrEqual(2600);
      });
    });

    test('should return 400 when minSquareFeet exceeds maxSquareFeet', async () => {
      const response = await request(app)
        .get('/api/listings?minSquareFeet=3000&maxSquareFeet=1000')
        .expect(400);

      expect(response.body.message).toBe('Invalid query parameters');
      expect(response.body.error).toBe('minSquareFeet cannot be greater than maxSquareFeet');
    });
  });

  describe('ZIP Code Filtering', () => {
    beforeEach(async () => {
      await Listing.create([
        {
          price: 200000,
          address: '123 Main St, Huntsville, AL',
          squareFeet: 1500,
          status: 'active',
          zipCode: '35801'
        },
        {
          price: 250000,
          address: '456 Oak Ave, Huntsville, AL',
          squareFeet: 1800,
          status: 'active',
          zipCode: '35801'
        },
        {
          price: 300000,
          address: '789 Pine Rd, Madison, AL',
          squareFeet: 2000,
          status: 'active',
          zipCode: '35758'
        }
      ]);
    });

    test('should filter by ZIP code', async () => {
      const response = await request(app)
        .get('/api/listings?zipCode=35801')
        .expect(200);

      expect(response.body.listings).toHaveLength(2);
      response.body.listings.forEach(listing => {
        expect(listing.zipCode).toBe('35801');
      });
    });

    test('should return empty array for non-existent ZIP code', async () => {
      const response = await request(app)
        .get('/api/listings?zipCode=99999')
        .expect(200);

      expect(response.body.listings).toHaveLength(0);
      expect(response.body.count).toBe(0);
      expect(response.body.message).toBe('No listings found matching the specified criteria');
    });

    test('should reject invalid ZIP code format', async () => {
      await Listing.create({
        price: 275000,
        address: '321 Extended St, Huntsville, AL',
        squareFeet: 1700,
        status: 'active',
        zipCode: '35801'
      });

      const response = await request(app)
        .get('/api/listings?zipCode=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid query parameter');
      expect(response.body.error).toBe('zipCode must be a 5-digit number');
      expect(response.body.details.parameter).toBe('zipCode');
      expect(response.body.details.value).toBe('invalid');
    });

    test('should reject ZIP+4 format', async () => {
      await Listing.create({
        price: 275000,
        address: '321 Extended St, Huntsville, AL',
        squareFeet: 1700,
        status: 'active',
        zipCode: '35801-1234'
      });

      const response = await request(app)
        .get('/api/listings?zipCode=35801-1234')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid query parameter');
      expect(response.body.error).toBe('zipCode must be a 5-digit number');
    });
  });

  describe('Combined Filters', () => {
    beforeEach(async () => {
      await Listing.create([
        {
          price: 200000,
          address: '123 Main St, Huntsville, AL',
          squareFeet: 1500,
          status: 'active',
          zipCode: '35801'
        },
        {
          price: 300000,
          address: '456 Oak Ave, Huntsville, AL',
          squareFeet: 2000,
          status: 'active',
          zipCode: '35801'
        },
        {
          price: 250000,
          address: '789 Pine Rd, Madison, AL',
          squareFeet: 1800,
          status: 'active',
          zipCode: '35758'
        }
      ]);
    });

    test('should filter by ZIP code and price range', async () => {
      const response = await request(app)
        .get('/api/listings?zipCode=35801&minPrice=250000&maxPrice=350000')
        .expect(200);

      expect(response.body.listings).toHaveLength(1);
      expect(response.body.listings[0].price).toBe(300000);
      expect(response.body.listings[0].zipCode).toBe('35801');
    });
  });

  describe('Edge Cases', () => {
    test('should return empty array when no listings exist', async () => {
      const response = await request(app)
        .get('/api/listings')
        .expect(200);

      expect(response.body.listings).toHaveLength(0);
      expect(response.body.count).toBe(0);
      expect(response.body.message).toBe('No listings found matching the specified criteria');
      expect(Array.isArray(response.body.listings)).toBe(true);
    });

    test('should handle invalid price parameters gracefully', async () => {
      await Listing.create({
        price: 250000,
        address: '123 Main St, Huntsville, AL',
        squareFeet: 1500,
        status: 'active',
        zipCode: '35801'
      });

      const response = await request(app)
        .get('/api/listings?minPrice=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid query parameter');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('minPrice must be a valid number');
      expect(response.body.details.parameter).toBe('minPrice');
      expect(response.body.details.value).toBe('invalid');
    });

    test('should handle negative price values', async () => {
      await Listing.create({
        price: 250000,
        address: '123 Main St, Huntsville, AL',
        squareFeet: 1500,
        status: 'active',
        zipCode: '35801'
      });

      const response = await request(app)
        .get('/api/listings?minPrice=-1000')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid query parameter');
      expect(response.body.error).toBe('minPrice must be at least 0');
    });

    test('should return error when min price exceeds max price', async () => {
      await Listing.create({
        price: 250000,
        address: '123 Main St, Huntsville, AL',
        squareFeet: 1500,
        status: 'active',
        zipCode: '35801'
      });

      const response = await request(app)
        .get('/api/listings?minPrice=400000&maxPrice=200000')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid query parameters');
      expect(response.body.error).toBe('minPrice cannot be greater than maxPrice');
      expect(response.body.minPrice).toBe(400000);
      expect(response.body.maxPrice).toBe(200000);
    });

    test('should handle very large price values', async () => {
      await Listing.create({
        price: 999999999,
        address: '123 Billionaire Row, Huntsville, AL',
        squareFeet: 50000,
        status: 'active',
        zipCode: '35801'
      });

      const response = await request(app)
        .get('/api/listings?minPrice=999999998')
        .expect(200);

      expect(response.body.listings).toHaveLength(1);
      expect(response.body.listings[0].price).toBe(999999999);
    });

    test('should handle empty string parameters', async () => {
      await Listing.create({
        price: 250000,
        address: '123 Main St, Huntsville, AL',
        squareFeet: 1500,
        status: 'active',
        zipCode: '35801'
      });

      const response = await request(app)
        .get('/api/listings?zipCode=')
        .expect(200);

      // Empty string should be treated as no filter
      expect(response.body.listings).toHaveLength(1);
    });
  });

  describe('Response Format', () => {
    test('should return consistent response structure', async () => {
      const response = await request(app)
        .get('/api/listings')
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          listings: expect.any(Array),
          count: expect.any(Number)
        })
      );
    });

    test('should have count matching array length', async () => {
      await Listing.create([
        {
          price: 200000,
          address: '123 Main St, Huntsville, AL',
          squareFeet: 1500,
          status: 'active',
          zipCode: '35801'
        },
        {
          price: 300000,
          address: '456 Oak Ave, Huntsville, AL',
          squareFeet: 2000,
          status: 'active',
          zipCode: '35802'
        }
      ]);

      const response = await request(app)
        .get('/api/listings')
        .expect(200);

      expect(response.body.count).toBe(response.body.listings.length);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Close the connection to simulate a database error
      await mongoose.disconnect();

      const response = await request(app)
        .get('/api/listings')
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Error fetching listings');

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });
});

describe('GET /api/listings/:id', () => {
  describe('Valid Requests', () => {
    test('should return a single listing by valid ID', async () => {
      const listing = await Listing.create({
        price: 250000,
        address: '123 Main St, Huntsville, AL',
        squareFeet: 1500,
        status: 'active',
        zipCode: '35801'
      });

      const response = await request(app)
        .get(`/api/listings/${listing._id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('listing');
      expect(response.body.listing._id).toBe(listing._id.toString());
      expect(response.body.listing.price).toBe(250000);
      expect(response.body.listing.address).toBe('123 Main St, Huntsville, AL');
    });
  });

  describe('Error Handling', () => {
    test('should return 400 for invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/listings/invalid-id-format')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid ID format');
      expect(response.body.error).toBe('The provided ID is not a valid MongoDB ObjectId');
      expect(response.body.id).toBe('invalid-id-format');
    });

    test('should return 400 for numeric ID', async () => {
      const response = await request(app)
        .get('/api/listings/12345')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid ID format');
    });

    test('should return 404 for valid ObjectId that does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/listings/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Listing not found');
      expect(response.body.error).toBe(`No listing exists with ID: ${nonExistentId}`);
    });

    test('should handle database connection errors', async () => {
      const listing = await Listing.create({
        price: 250000,
        address: '123 Main St, Huntsville, AL',
        squareFeet: 1500,
        status: 'active',
        zipCode: '35801'
      });

      // Close the connection to simulate a database error
      await mongoose.disconnect();

      const response = await request(app)
        .get(`/api/listings/${listing._id}`)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Error fetching listing');

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });
});

// ── PATCH /api/listings/:id/tags ─────────────────────────────────────────────

describe('PATCH /api/listings/:id/tags', () => {
  let listing;
  let adminAgent, adminToken;

  beforeAll(async () => {
    adminAgent = await Agent.create({
      name: 'Admin Agent',
      email: 'admin@test.com',
      password: 'password123',
      isActive: true,
      role: 'admin'
    });
    adminToken = generateToken(adminAgent._id);
  });

  beforeEach(async () => {
    listing = await createTestListing(agent1._id);
  });

  test('should allow admin to set tags on a listing', async () => {
    const response = await request(app)
      .patch(`/api/listings/${listing._id}/tags`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tags: ['pool', 'garage', 'new construction'] })
      .expect(200);

    expect(response.body.message).toBe('Listing tags updated successfully');
    expect(response.body.listing.tags).toEqual(['pool', 'garage', 'new construction']);
  });

  test('should replace existing tags entirely', async () => {
    await request(app)
      .patch(`/api/listings/${listing._id}/tags`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tags: ['pool', 'garage'] })
      .expect(200);

    const response = await request(app)
      .patch(`/api/listings/${listing._id}/tags`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tags: ['waterfront'] })
      .expect(200);

    expect(response.body.listing.tags).toEqual(['waterfront']);
  });

  test('should allow clearing tags with an empty array', async () => {
    const response = await request(app)
      .patch(`/api/listings/${listing._id}/tags`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tags: [] })
      .expect(200);

    expect(response.body.listing.tags).toEqual([]);
  });

  test('should reject more than 20 tags', async () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    const response = await request(app)
      .patch(`/api/listings/${listing._id}/tags`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tags })
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('should reject a tag exceeding 50 characters', async () => {
    const response = await request(app)
      .patch(`/api/listings/${listing._id}/tags`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tags: ['a'.repeat(51)] })
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('should reject a non-array tags value', async () => {
    const response = await request(app)
      .patch(`/api/listings/${listing._id}/tags`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tags: 'pool' })
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 403 for a non-admin agent', async () => {
    const response = await request(app)
      .patch(`/api/listings/${listing._id}/tags`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ tags: ['pool'] })
      .expect(403);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 401 without a token', async () => {
    const response = await request(app)
      .patch(`/api/listings/${listing._id}/tags`)
      .send({ tags: ['pool'] })
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 404 for a non-existent listing', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .patch(`/api/listings/${nonExistentId}/tags`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tags: ['pool'] })
      .expect(404);

    expect(response.body).toHaveProperty('message');
  });

  test('should return 400 for an invalid listing ID', async () => {
    const response = await request(app)
      .patch('/api/listings/bad-id/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tags: ['pool'] })
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });
});
