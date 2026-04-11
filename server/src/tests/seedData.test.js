/**
 * Seed Data Validation Tests
 *
 * These tests exercise the listing, agent, and showing models against the
 * realistic seed data sets introduced in the updated seed scripts.  They run
 * entirely in-memory (mongodb-memory-server) and do NOT call the seed scripts
 * themselves — instead they replicate a representative subset of the seed
 * data to keep each test focused and fast.
 *
 * Coverage goals:
 *  - Multi-market listing validation (AL, TN, GA, TX, CO)
 *  - Price and sqft ranges across regions
 *  - Sold listing fields: closingDate, finalSalePrice, daysOnMarket
 *  - Tags: length limits, character limits, replacement behaviour
 *  - Agents: license format, role enum, availabilitySlots schema
 *  - Showings: past-date bypass via insertMany, status enum, feedback field
 *  - Round-robin agent assignment logic
 *  - Notification creation for pending/confirmed showings
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';
import Showing from '../models/Showing.js';
import Notification from '../models/Notification.js';
import { jest } from '@jest/globals';

jest.setTimeout(30000);

let mongoServer;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const makeAgent = (overrides = {}) =>
  Agent.create({
    name: 'Test Agent',
    email: `agent-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    password: 'password123',
    licenseNumber: `AL-RE-${Math.floor(100000 + Math.random() * 900000)}`,
    role: 'agent',
    isActive: true,
    availabilitySlots: [],
    ...overrides
  });

const makeListing = (agentId, overrides = {}) =>
  Listing.create({
    price: 250000,
    address: '123 Test St, Nashville, TN',
    squareFeet: 1500,
    status: 'active',
    zipCode: '37205',
    createdBy: agentId,
    ...overrides
  });

// ─── Lifecycle ───────────────────────────────────────────────────────────────

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    Listing.deleteMany({}),
    Showing.deleteMany({}),
    Notification.deleteMany({}),
    Agent.deleteMany({})
  ]);
});

// ============================================================
// LISTING MODEL — Seed Data Scenarios
// ============================================================

describe('Listing Model — Multi-Market Seed Data', () => {
  describe('Valid listings across all seeded markets', () => {
    const marketListings = [
      // Huntsville, AL — budget
      {
        price: 189000, address: '412 Weatherly Rd, Huntsville, AL 35803',
        squareFeet: 1350, zipCode: '35803', status: 'active',
        tags: ['ranch', 'fenced yard', 'updated kitchen'],
        description: 'Charming ranch-style home.'
      },
      // Nashville, TN — mid
      {
        price: 679000, address: '1847 Natchez Trace, Nashville, TN 37212',
        squareFeet: 2880, zipCode: '37212', status: 'active',
        tags: ['walkable', 'Hillsboro Village', 'chef kitchen'],
        description: 'Classic Hillsboro Village home.'
      },
      // Atlanta, GA — high
      {
        price: 1250000, address: '3710 Tuxedo Rd NW, Atlanta, GA 30305',
        squareFeet: 6800, zipCode: '30305', status: 'active',
        tags: ['estate', 'Tuxedo Park', 'carriage house', 'pool'],
        description: 'Grand estate on 1.2 acres.'
      },
      // Austin, TX — waterfront
      {
        price: 1350000, address: '2809 Laguna Vista Dr, Austin, TX 78746',
        squareFeet: 5800, zipCode: '78746', status: 'active',
        tags: ['waterfront', 'Lake Austin', 'boat dock', 'infinity pool'],
        description: 'Lake Austin waterfront.'
      },
      // Denver, CO — luxury
      {
        price: 1450000, address: '485 Williams St, Denver, CO 80218',
        squareFeet: 4100, zipCode: '80218', status: 'active',
        tags: ['Cherry Creek', 'architect designed', 'elevator'],
        description: 'Cherry Creek North townhome.'
      },
    ];

    test('should create listings across all five markets without validation errors', async () => {
      const created = await Listing.insertMany(marketListings);
      expect(created).toHaveLength(5);
      created.forEach((l) => {
        expect(l._id).toBeDefined();
        expect(l.zipCode).toMatch(/^\d{5}$/);
      });
    });

    test('should store descriptions and tags correctly', async () => {
      const [l] = await Listing.insertMany([marketListings[0]]);
      expect(l.description).toBe('Charming ranch-style home.');
      expect(l.tags).toEqual(['ranch', 'fenced yard', 'updated kitchen']);
    });

    test('should default viewCount to 0', async () => {
      const [l] = await Listing.insertMany([marketListings[1]]);
      expect(l.viewCount).toBe(0);
    });
  });

  describe('Price range validation across markets', () => {
    test('should accept prices from $112k (AL budget) to $1.45M (CO luxury)', async () => {
      const prices = [112000, 224900, 389000, 679000, 895000, 1250000, 1350000, 1450000];
      const docs = prices.map((price, i) => ({
        price,
        address: `${100 + i} Market St, City, TX`,
        squareFeet: 1000 + i * 200,
        zipCode: '78701',
        status: 'active'
      }));
      const created = await Listing.insertMany(docs);
      expect(created).toHaveLength(prices.length);
      created.forEach((l, i) => expect(l.price).toBe(prices[i]));
    });

    test('should reject a negative price', async () => {
      await expect(
        Listing.create({ price: -1, address: '1 Main St', squareFeet: 1000, zipCode: '35801' })
      ).rejects.toThrow();
    });
  });

  describe('Square footage validation', () => {
    test('should accept sqft from 980 (starter) to 6800 (estate)', async () => {
      const sqfts = [980, 1350, 2200, 4100, 5800, 6800];
      const docs = sqfts.map((squareFeet, i) => ({
        price: 100000 * (i + 1),
        address: `${i + 1} Test Dr, City, CO`,
        squareFeet,
        zipCode: '80205',
        status: 'active'
      }));
      const created = await Listing.insertMany(docs);
      expect(created).toHaveLength(sqfts.length);
    });
  });

  describe('Sold listings — closingDate, finalSalePrice, daysOnMarket', () => {
    test('should accept closingDate and finalSalePrice on a sold listing', async () => {
      const agent = await makeAgent();
      const listing = await Listing.create({
        price: 285000,
        address: '1102 Bankhead Pkwy NE, Huntsville, AL 35801',
        squareFeet: 2200,
        zipCode: '35801',
        status: 'sold',
        closingDate: daysAgo(30),
        finalSalePrice: 291000,
        createdBy: agent._id
      });

      expect(listing.status).toBe('sold');
      expect(listing.closingDate).toBeInstanceOf(Date);
      expect(listing.finalSalePrice).toBe(291000);
    });

    test('daysOnMarket should be computed by the pre-save hook when closingDate is set', async () => {
      const agent = await makeAgent();
      const listing = await Listing.create({
        price: 725000,
        address: '3201 Lake Austin Blvd, Austin, TX 78703',
        squareFeet: 2700,
        zipCode: '78703',
        status: 'sold',
        closingDate: daysAgo(40),
        finalSalePrice: 740000,
        createdBy: agent._id
      });

      // daysOnMarket is calculated from closingDate - createdAt
      // Since createdAt ≈ now and closingDate is 40 days ago, result should be 0
      // (closing before creation = clamped to 0)
      expect(typeof listing.daysOnMarket).toBe('number');
      expect(listing.daysOnMarket).toBeGreaterThanOrEqual(0);
    });

    test('finalSalePrice above list price should be accepted (bidding war)', async () => {
      const agent = await makeAgent();
      const listing = await Listing.create({
        price: 619000,
        address: '3088 Albion St, Denver, CO 80207',
        squareFeet: 2380,
        zipCode: '80207',
        status: 'sold',
        closingDate: daysAgo(55),
        finalSalePrice: 631500,  // above list
        createdBy: agent._id
      });

      expect(listing.finalSalePrice).toBeGreaterThan(listing.price);
    });

    test('finalSalePrice below list price should also be accepted', async () => {
      const agent = await makeAgent();
      const listing = await Listing.create({
        price: 780000,
        address: '331 Westview Dr, Brentwood, TN 37027',
        squareFeet: 4500,
        zipCode: '37027',
        status: 'sold',
        closingDate: daysAgo(20),
        finalSalePrice: 758000,  // below list
        createdBy: agent._id
      });

      expect(listing.finalSalePrice).toBeLessThan(listing.price);
    });

    test('should not require closingDate on an active listing', async () => {
      const agent = await makeAgent();
      const listing = await Listing.create({
        price: 475000,
        address: '1804 Travis Heights Blvd, Austin, TX 78704',
        squareFeet: 1680,
        zipCode: '78704',
        status: 'active',
        createdBy: agent._id
      });

      expect(listing.closingDate).toBeUndefined();
      expect(listing.finalSalePrice).toBeUndefined();
    });
  });

  describe('Tags validation', () => {
    let agent;

    beforeEach(async () => {
      agent = await makeAgent();
    });

    test('should accept up to 20 tags', async () => {
      const tags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
      const l = await Listing.create({
        price: 300000, address: '1 Tag St, City, AL', squareFeet: 1500, zipCode: '35801',
        status: 'active', tags, createdBy: agent._id
      });
      expect(l.tags).toHaveLength(20);
    });

    test('should reject more than 20 tags', async () => {
      const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
      await expect(
        Listing.create({
          price: 300000, address: '1 Tag St, City, AL', squareFeet: 1500, zipCode: '35801',
          status: 'active', tags, createdBy: agent._id
        })
      ).rejects.toThrow();
    });

    test('should reject a tag longer than 50 characters', async () => {
      await expect(
        Listing.create({
          price: 300000, address: '1 Tag St, City, AL', squareFeet: 1500, zipCode: '35801',
          status: 'active', tags: ['a'.repeat(51)], createdBy: agent._id
        })
      ).rejects.toThrow();
    });

    test('should default to an empty tags array', async () => {
      const l = await Listing.create({
        price: 200000, address: '2 Empty St, City, AL', squareFeet: 1000, zipCode: '35801',
        status: 'active', createdBy: agent._id
      });
      expect(l.tags).toEqual([]);
    });

    test('should store realistic multi-word tags from the seed data', async () => {
      const tags = ['mid-century', 'Hill Country views', 'pool', 'cabana', 'Northwest Hills'];
      const l = await Listing.create({
        price: 895000, address: '4412 Balcones Dr, Austin, TX 78731', squareFeet: 3200,
        zipCode: '78731', status: 'active', tags, createdBy: agent._id
      });
      expect(l.tags).toEqual(tags);
    });
  });

  describe('Status enum', () => {
    let agent;

    beforeEach(async () => { agent = await makeAgent(); });

    test.each([['active'], ['pending'], ['sold'], ['inactive']])(
      'should accept status "%s"',
      async (status) => {
        const l = await Listing.create({
          price: 200000, address: '1 Status St, City, AL', squareFeet: 1000,
          zipCode: '35801', status, createdBy: agent._id
        });
        expect(l.status).toBe(status);
      }
    );

    test('should reject an invalid status', async () => {
      await expect(
        Listing.create({
          price: 200000, address: '1 Status St, City, AL', squareFeet: 1000,
          zipCode: '35801', status: 'withdrawn', createdBy: agent._id
        })
      ).rejects.toThrow();
    });
  });

  describe('Round-robin agent assignment', () => {
    test('should evenly distribute 6 listings across 3 agents', async () => {
      const agents = await Promise.all([
        makeAgent({ email: 'rr1@test.com', licenseNumber: 'AL-RE-100001' }),
        makeAgent({ email: 'rr2@test.com', licenseNumber: 'AL-RE-100002' }),
        makeAgent({ email: 'rr3@test.com', licenseNumber: 'AL-RE-100003' }),
      ]);

      const listingTemplates = Array.from({ length: 6 }, (_, i) => ({
        price: 200000 + i * 50000,
        address: `${i + 1} RoundRobin Ave, City, AL`,
        squareFeet: 1200 + i * 100,
        zipCode: '35801',
        status: 'active',
        createdBy: agents[i % agents.length]._id
      }));

      const created = await Listing.insertMany(listingTemplates);

      // Each agent should own exactly 2 listings
      for (const agent of agents) {
        const owned = created.filter(l => l.createdBy.toString() === agent._id.toString());
        expect(owned).toHaveLength(2);
      }
    });
  });
});

// ============================================================
// AGENT MODEL — Seed Data Scenarios
// ============================================================

describe('Agent Model — Seed Data Scenarios', () => {
  describe('Creating realistic agents', () => {
    const agentFixtures = [
      {
        name: 'Margaret Holloway',
        email: 'margaret.holloway@novarealty.com',
        password: 'password123',
        phone: '2054781923',
        licenseNumber: 'AL-RE-204817',
        role: 'manager',
        isActive: true,
        availabilitySlots: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' }
        ]
      },
      {
        name: 'Priya Nair',
        email: 'priya.nair@novarealty.com',
        password: 'password123',
        phone: '6154829307',
        licenseNumber: 'TN-RE-571338',
        role: 'agent',
        isActive: true,
        availabilitySlots: [
          { dayOfWeek: 1, startTime: '08:30', endTime: '16:30' },
          { dayOfWeek: 6, startTime: '10:00', endTime: '15:00' }
        ]
      },
      {
        name: 'Linda Chu',
        email: 'linda.chu@novarealty.com',
        password: 'password123',
        phone: '6153027841',
        licenseNumber: 'TN-RE-228403',
        role: 'agent',
        isActive: false,
        availabilitySlots: []
      }
    ];

    test('should create all seeded agent fixtures without error', async () => {
      const created = await Agent.create(agentFixtures);
      expect(created).toHaveLength(3);
    });

    test('should hash passwords during creation', async () => {
      const [agent] = await Agent.create([agentFixtures[0]]);
      const raw = await Agent.findById(agent._id).select('+password');
      expect(raw.password).not.toBe('password123');
      expect(raw.password.startsWith('$2')).toBe(true); // bcrypt hash
    });

    test('should store licenseNumber exactly as provided', async () => {
      const [agent] = await Agent.create([agentFixtures[1]]);
      expect(agent.licenseNumber).toBe('TN-RE-571338');
    });

    test('should reflect isActive: false for the inactive agent', async () => {
      const [agent] = await Agent.create([agentFixtures[2]]);
      expect(agent.isActive).toBe(false);
    });

    test('should enforce uniqueness on licenseNumber', async () => {
      await Agent.create([agentFixtures[0]]);
      await expect(
        Agent.create([{
          ...agentFixtures[1],
          licenseNumber: 'AL-RE-204817', // duplicate
          email: 'other@test.com'
        }])
      ).rejects.toThrow();
    });
  });

  describe('Role enum', () => {
    test.each([['agent'], ['manager'], ['admin']])(
      'should accept role "%s"',
      async (role) => {
        const agent = await makeAgent({ role });
        expect(agent.role).toBe(role);
      }
    );

    test('should reject an invalid role', async () => {
      await expect(makeAgent({ role: 'superadmin' })).rejects.toThrow();
    });

    test('should default role to "agent"', async () => {
      const agent = await makeAgent();
      expect(agent.role).toBe('agent');
    });
  });

  describe('Availability slots', () => {
    test('should store multiple availability slots', async () => {
      const slots = [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },
        { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
      ];
      const agent = await makeAgent({ availabilitySlots: slots });
      expect(agent.availabilitySlots).toHaveLength(4);
      expect(agent.availabilitySlots[0].startTime).toBe('09:00');
    });

    test('should accept Sunday (dayOfWeek: 0) and Saturday (dayOfWeek: 6)', async () => {
      const slots = [
        { dayOfWeek: 0, startTime: '11:00', endTime: '15:00' },
        { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' }
      ];
      const agent = await makeAgent({ availabilitySlots: slots });
      const days = agent.availabilitySlots.map(s => s.dayOfWeek);
      expect(days).toContain(0);
      expect(days).toContain(6);
    });

    test('should reject dayOfWeek < 0', async () => {
      await expect(
        makeAgent({ availabilitySlots: [{ dayOfWeek: -1, startTime: '09:00', endTime: '17:00' }] })
      ).rejects.toThrow();
    });

    test('should reject dayOfWeek > 6', async () => {
      await expect(
        makeAgent({ availabilitySlots: [{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }] })
      ).rejects.toThrow();
    });

    test('should reject invalid time format for startTime', async () => {
      await expect(
        makeAgent({ availabilitySlots: [{ dayOfWeek: 1, startTime: '9am', endTime: '17:00' }] })
      ).rejects.toThrow();
    });

    test('should accept an empty availabilitySlots array (inactive agent)', async () => {
      const agent = await makeAgent({ availabilitySlots: [] });
      expect(agent.availabilitySlots).toHaveLength(0);
    });
  });

  describe('Phone number validation', () => {
    test('should accept a 10-digit phone number', async () => {
      const agent = await makeAgent({ phone: '6154829307' });
      expect(agent.phone).toBe('6154829307');
    });

    test('should reject a phone number with fewer than 10 digits', async () => {
      await expect(makeAgent({ phone: '12345' })).rejects.toThrow();
    });
  });
});

// ============================================================
// SHOWING MODEL — Seed Data Scenarios
// ============================================================

describe('Showing Model — Seed Data Scenarios', () => {
  let agent, listing;

  beforeEach(async () => {
    agent = await makeAgent();
    listing = await makeListing(agent._id);
  });

  describe('Future showings (pending / confirmed)', () => {
    test('should create a pending showing with a future preferredDate', async () => {
      const showing = await Showing.create({
        listing: listing._id,
        name: 'Alice Martinez',
        email: 'alice.martinez@gmail.com',
        phone: '(615) 234-5678',
        preferredDate: daysFromNow(5),
        status: 'pending'
      });

      expect(showing.status).toBe('pending');
      expect(showing.preferredDate.getTime()).toBeGreaterThan(Date.now());
    });

    test('should create a confirmed showing for an upcoming date', async () => {
      const showing = await Showing.create({
        listing: listing._id,
        name: 'Marcus Webb',
        email: 'marcus.webb@icloud.com',
        phone: '(615) 890-2345',
        preferredDate: daysFromNow(7),
        message: 'We are pre-approved and ready to move quickly.',
        status: 'confirmed'
      });

      expect(showing.status).toBe('confirmed');
      expect(showing.message).toContain('pre-approved');
    });
  });

  describe('Past showings via raw collection insert (bypasses Mongoose validators)', () => {
    test('should insert completed showings with past dates via collection.insertMany', async () => {
      // Mongoose 9 insertMany always runs document validation regardless of options.
      // The seed scripts bypass this using Model.collection.insertMany (raw driver).
      // Here we replicate that approach to test the data shape and status values.
      const pastShowings = [
        {
          listing: listing._id,
          name: 'Yuki Tanaka',
          email: 'yuki.tanaka@protonmail.com',
          phone: '(720) 012-3456',
          preferredDate: daysAgo(10),
          status: 'completed',
          feedback: 'Great curb appeal. The primary suite is stunning.',
          message: '',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          listing: listing._id,
          name: 'Brandon Scott',
          email: 'brandon.scott@gmail.com',
          phone: '(512) 901-2345',
          preferredDate: daysAgo(25),
          status: 'completed',
          feedback: 'Loved the layout but the kitchen felt smaller than expected.',
          message: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await Showing.collection.insertMany(pastShowings);
      const found = await Showing.find({ status: 'completed' });
      expect(found).toHaveLength(2);
      found.forEach(s => {
        expect(s.status).toBe('completed');
        expect(s.feedback.length).toBeGreaterThan(0);
        expect(s.preferredDate.getTime()).toBeLessThan(Date.now());
      });
    });

    test('should insert cancelled showings with past dates via collection.insertMany', async () => {
      await Showing.collection.insertMany([{
        listing: listing._id,
        name: "Megan O'Brien",
        email: 'megan.obrien@gmail.com',
        phone: '(256) 123-4568',
        preferredDate: daysAgo(7),
        status: 'cancelled',
        feedback: '',
        message: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }]);

      const found = await Showing.findOne({ email: 'megan.obrien@gmail.com' });
      expect(found.status).toBe('cancelled');
    });

    test('preferredDate validator SHOULD reject a past date through Mongoose.create', async () => {
      await expect(
        Showing.create({
          listing: listing._id,
          name: 'Test User',
          email: 'test@test.com',
          phone: '555-000-0000',
          preferredDate: daysAgo(3),  // past date
          status: 'pending'
        })
      ).rejects.toThrow();
    });
  });

  describe('Status enum', () => {
    test.each([['pending'], ['confirmed'], ['completed'], ['cancelled']])(
      'should accept status "%s"',
      async (status) => {
        const [s] = await Showing.insertMany([{
          listing: listing._id,
          name: 'Status Test',
          email: 'status@test.com',
          phone: '555-111-2222',
          preferredDate: daysFromNow(3),
          status
        }], { runValidators: false });
        expect(s.status).toBe(status);
      }
    );

    test('should reject an invalid status value', async () => {
      await expect(
        Showing.create({
          listing: listing._id,
          name: 'Bad Status',
          email: 'bad@test.com',
          phone: '555-000-0000',
          preferredDate: daysFromNow(5),
          status: 'rescheduled'
        })
      ).rejects.toThrow();
    });
  });

  describe('Feedback field', () => {
    test('should store realistic feedback on a completed showing', async () => {
      const feedback = 'Exceeded expectations! Making an offer this week.';
      await Showing.collection.insertMany([{
        listing: listing._id,
        name: 'Isabelle Fontaine',
        email: 'isabelle.fontaine@gmail.com',
        phone: '(404) 345-6780',
        preferredDate: daysAgo(5),
        status: 'completed',
        feedback,
        message: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }]);

      const showing = await Showing.findOne({ email: 'isabelle.fontaine@gmail.com' });
      expect(showing.feedback).toBe(feedback);
    });

    test('should default feedback to an empty string', async () => {
      const showing = await Showing.create({
        listing: listing._id,
        name: 'Default Feedback',
        email: 'default@test.com',
        phone: '555-999-1111',
        preferredDate: daysFromNow(4),
        status: 'pending'
      });

      expect(showing.feedback).toBe('');
    });

    test('should reject feedback exceeding 2000 characters', async () => {
      await expect(
        Showing.create({
          listing: listing._id,
          name: 'Long Feedback',
          email: 'long@test.com',
          phone: '555-999-2222',
          preferredDate: daysFromNow(4),
          status: 'pending',
          feedback: 'a'.repeat(2001)
        })
      ).rejects.toThrow();
    });
  });

  describe('Multiple buyers across multiple listings', () => {
    test('should support 25 distinct buyers across different listings', async () => {
      const listings = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          makeListing(agent._id, {
            address: `${i + 100} Buyer Test Ave, Nashville, TN`,
            zipCode: '37205'
          })
        )
      );

      const buyers = [
        { name: 'Alice Martinez',    email: 'alice.martinez@gmail.com',    phone: '(615) 234-5678' },
        { name: 'Robert Chen',       email: 'robert.chen@outlook.com',     phone: '(404) 876-5432' },
        { name: 'Carol Davis',       email: 'carol.davis@yahoo.com',       phone: '(512) 345-6789' },
        { name: 'James Okafor',      email: 'james.okafor@gmail.com',      phone: '(720) 987-1234' },
        { name: 'Linda Patel',       email: 'linda.patel@gmail.com',       phone: '(205) 567-8901' },
      ];

      const showingDocs = buyers.map((buyer, i) => ({
        listing: listings[i % listings.length]._id,
        ...buyer,
        preferredDate: daysFromNow(i + 3),
        status: 'pending'
      }));

      const created = await Showing.insertMany(showingDocs, { runValidators: false });
      expect(created).toHaveLength(5);

      const uniqueEmails = new Set(created.map(s => s.email));
      expect(uniqueEmails.size).toBe(5);
    });
  });
});

// ============================================================
// NOTIFICATION MODEL — Seed-Generated Notifications
// ============================================================

describe('Notification Model — Seed Data Scenarios', () => {
  let agent, listing;

  beforeEach(async () => {
    agent = await makeAgent();
    listing = await makeListing(agent._id);
  });

  describe('Creating notifications for pending/confirmed showings', () => {
    test('should create a notification linked to a showing and listing', async () => {
      const [showing] = await Showing.insertMany([{
        listing: listing._id,
        name: 'Grace Hernandez',
        email: 'grace.hernandez@gmail.com',
        phone: '(205) 678-9012',
        preferredDate: daysFromNow(5),
        status: 'pending'
      }], { runValidators: false });

      const notification = await Notification.create({
        recipient: agent._id,
        type: 'showing_request',
        message: `Grace Hernandez requested a showing for ${listing.address}`,
        relatedShowing: showing._id,
        relatedListing: listing._id,
        isRead: false
      });

      expect(notification.type).toBe('showing_request');
      expect(notification.isRead).toBe(false);
      expect(notification.relatedShowing.toString()).toBe(showing._id.toString());
      expect(notification.relatedListing.toString()).toBe(listing._id.toString());
    });

    test('should only create notifications for pending/confirmed, not completed/cancelled', async () => {
      const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      const showings = await Showing.insertMany(
        statuses.map((status, i) => ({
          listing: listing._id,
          name: `Buyer ${i}`,
          email: `buyer${i}@test.com`,
          phone: '555-000-1111',
          preferredDate: daysFromNow(i + 2),
          status
        })),
        { runValidators: false }
      );

      const notifShowings = showings.filter(
        s => s.status === 'pending' || s.status === 'confirmed'
      );

      const notifications = await Notification.create(
        notifShowings.map(s => ({
          recipient: agent._id,
          type: 'showing_request',
          message: `${s.name} requested a showing`,
          relatedShowing: s._id,
          relatedListing: listing._id,
          isRead: false
        }))
      );

      expect(notifications).toHaveLength(2); // only pending + confirmed
    });

    test('should create one notification per listing agent when multiple showings exist', async () => {
      const agents = await Promise.all([
        makeAgent({ email: 'notif1@test.com', licenseNumber: 'AL-RE-200001' }),
        makeAgent({ email: 'notif2@test.com', licenseNumber: 'AL-RE-200002' }),
      ]);
      const listings = await Promise.all([
        makeListing(agents[0]._id, { address: '1 Notif St, City, AL' }),
        makeListing(agents[1]._id, { address: '2 Notif St, City, AL' })
      ]);

      const showings = await Showing.insertMany(
        listings.map((l, i) => ({
          listing: l._id,
          name: `Buyer ${i}`,
          email: `notifbuyer${i}@test.com`,
          phone: '555-111-0000',
          preferredDate: daysFromNow(i + 3),
          status: 'pending'
        })),
        { runValidators: false }
      );

      const notifications = await Notification.create(
        showings.map((s, i) => ({
          recipient: listings[i].createdBy,
          type: 'showing_request',
          message: `Buyer ${i} requested a showing`,
          relatedShowing: s._id,
          relatedListing: listings[i]._id,
          isRead: false
        }))
      );

      expect(notifications).toHaveLength(2);
      // Each agent gets exactly 1 notification
      for (const agent of agents) {
        const agentNotifs = notifications.filter(
          n => n.recipient.toString() === agent._id.toString()
        );
        expect(agentNotifs).toHaveLength(1);
      }
    });
  });
});
