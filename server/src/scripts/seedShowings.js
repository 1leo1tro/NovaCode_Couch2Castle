import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Showing from '../models/Showing.js';
import Notification from '../models/Notification.js';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';

// Helper: date N days from now
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

// Helper: date N days ago (for completed/cancelled showings)
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// Helper: set specific time on a date
const withTime = (date, hour, minute = 0) => {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// 25 realistic buyer personas
const buyers = [
  { name: 'Alice Martinez',    email: 'alice.martinez@gmail.com',    phone: '(615) 234-5678' },
  { name: 'Robert Chen',       email: 'robert.chen@outlook.com',     phone: '(404) 876-5432' },
  { name: 'Carol Davis',       email: 'carol.davis@yahoo.com',       phone: '(512) 345-6789' },
  { name: 'James Okafor',      email: 'james.okafor@gmail.com',      phone: '(720) 987-1234' },
  { name: 'Linda Patel',       email: 'linda.patel@gmail.com',       phone: '(205) 567-8901' },
  { name: 'Marcus Webb',       email: 'marcus.webb@icloud.com',      phone: '(615) 890-2345' },
  { name: 'Sophia Kim',        email: 'sophia.kim@gmail.com',        phone: '(404) 234-5670' },
  { name: 'David Nguyen',      email: 'd.nguyen@protonmail.com',     phone: '(512) 678-9012' },
  { name: 'Rachel Torres',     email: 'rachel.torres@gmail.com',     phone: '(720) 123-4567' },
  { name: 'Kevin Murphy',      email: 'kevin.murphy@outlook.com',    phone: '(256) 345-6780' },
  { name: 'Amara Jackson',     email: 'amara.jackson@gmail.com',     phone: '(615) 456-7891' },
  { name: 'Tyler Brooks',      email: 'tyler.brooks@yahoo.com',      phone: '(404) 567-8902' },
  { name: 'Natalie Russo',     email: 'natalie.russo@gmail.com',     phone: '(512) 789-0123' },
  { name: 'Ethan Park',        email: 'ethan.park@icloud.com',       phone: '(720) 234-5678' },
  { name: 'Grace Hernandez',   email: 'grace.hernandez@gmail.com',   phone: '(205) 678-9012' },
  { name: 'Owen Fletcher',     email: 'owen.fletcher@outlook.com',   phone: '(615) 789-0123' },
  { name: 'Camille Dufour',    email: 'camille.dufour@gmail.com',    phone: '(404) 890-1234' },
  { name: 'Brandon Scott',     email: 'brandon.scott@gmail.com',     phone: '(512) 901-2345' },
  { name: 'Yuki Tanaka',       email: 'yuki.tanaka@protonmail.com',  phone: '(720) 012-3456' },
  { name: 'Megan O\'Brien',    email: 'megan.obrien@gmail.com',      phone: '(256) 123-4568' },
  { name: 'Darius Coleman',    email: 'darius.coleman@yahoo.com',    phone: '(615) 234-5679' },
  { name: 'Isabelle Fontaine', email: 'isabelle.fontaine@gmail.com', phone: '(404) 345-6780' },
  { name: 'Noah Williamson',   email: 'noah.w@outlook.com',          phone: '(512) 456-7891' },
  { name: 'Preethi Agarwal',   email: 'preethi.a@gmail.com',         phone: '(720) 567-8902' },
  { name: 'Samuel Grant',      email: 'samuel.grant@icloud.com',     phone: '(205) 678-9013' },
];

const messages = [
  'Very interested in this property! Would love to see it in person.',
  'My family is relocating to the area and this checks all our boxes. Can we schedule a tour?',
  'Saw this listing online and love the neighborhood. When can we visit?',
  'We have been searching for months — this one looks perfect. Please let me know your availability.',
  'First-time buyer here, very excited about this home. Is Saturday morning available?',
  'We are pre-approved and ready to move quickly. Would love to tour this weekend.',
  'Relocating from out of state for work. Can we do a video walkthrough if in-person is not available soon?',
  'The photos look great! We want to see the layout in person before making a decision.',
  'Interested in scheduling a tour. We have flexibility in the evenings or weekends.',
  'Our agent suggested this property and we agree it is a great fit. Please reach out to confirm.',
  'We love the location — can we schedule a showing at your earliest convenience?',
  'Investment buyer here — looking for a walkthrough to assess condition.',
  'Down-sizing from a larger home. This size is perfect for us. Available this week?',
  'Been following this listing since it went live. Very motivated buyers.',
  'Cash buyers, no contingencies. Would love to tour as soon as possible.',
];

const feedbacks = [
  'Loved the layout but the kitchen felt smaller than expected from the photos.',
  'Great curb appeal. The primary suite is stunning. We are seriously considering an offer.',
  'Neighborhood is perfect. Home needs some updates but we are factoring that into our offer.',
  'Not quite the right fit for our family — the yard was smaller than we need.',
  'Exceeded expectations! Making an offer this week.',
  'The basement was a bonus we did not expect. Very impressed overall.',
  'Appreciated the natural light throughout. A few deferred maintenance items noted.',
  'Beautiful home but priced slightly above our budget. We will keep watching.',
];

async function seed() {
  try {
    await connectDB();

    // Clear existing showings and notifications
    await Showing.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing showings and notifications.');

    // Load agents and listings
    const agents = await Agent.find({ isActive: true });
    if (agents.length === 0) {
      console.error('No active agents found. Run seed:agents first.');
      process.exit(1);
    }

    const allListings = await Listing.find({});
    if (allListings.length < 5) {
      console.error('Need at least 5 listings. Run seed (seedListings) first.');
      process.exit(1);
    }

    // Assign each listing to an agent (round-robin) if not already set
    for (let i = 0; i < allListings.length; i++) {
      if (!allListings[i].createdBy) {
        allListings[i].createdBy = agents[i % agents.length]._id;
        await allListings[i].save();
      }
    }

    // Helper: pick N random items from array
    const pick = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

    // Build showing data spread across listings, statuses, and dates
    const showingsData = [];

    // Upcoming / pending showings (15) — must be in the future
    const activeListings = allListings.filter((l) => l.status === 'active');
    const pendingListings = allListings.filter((l) => l.status === 'pending');
    const upcomingListings = [...activeListings, ...pendingListings];

    const pendingShowingDefs = [
      { daysOffset: 3,  hour: 10, buyerIdx: 0,  msgIdx: 0  },
      { daysOffset: 4,  hour: 14, buyerIdx: 1,  msgIdx: 1  },
      { daysOffset: 5,  hour: 11, buyerIdx: 2,  msgIdx: 2  },
      { daysOffset: 6,  hour: 15, buyerIdx: 3,  msgIdx: 3  },
      { daysOffset: 7,  hour: 10, buyerIdx: 4,  msgIdx: 4  },
      { daysOffset: 8,  hour: 13, buyerIdx: 5,  msgIdx: 5  },
      { daysOffset: 9,  hour: 16, buyerIdx: 6,  msgIdx: 6  },
      { daysOffset: 10, hour: 11, buyerIdx: 7,  msgIdx: 7  },
      { daysOffset: 12, hour: 14, buyerIdx: 8,  msgIdx: 8  },
      { daysOffset: 14, hour: 10, buyerIdx: 9,  msgIdx: 9  },
      { daysOffset: 15, hour: 15, buyerIdx: 10, msgIdx: 10 },
      { daysOffset: 17, hour: 11, buyerIdx: 11, msgIdx: 11 },
      { daysOffset: 18, hour: 13, buyerIdx: 12, msgIdx: 12 },
      { daysOffset: 20, hour: 10, buyerIdx: 13, msgIdx: 13 },
      { daysOffset: 21, hour: 14, buyerIdx: 14, msgIdx: 14 },
    ];

    pendingShowingDefs.forEach((def, i) => {
      const listing = upcomingListings[i % upcomingListings.length];
      const buyer = buyers[def.buyerIdx];
      showingsData.push({
        listing: listing._id,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        preferredDate: withTime(daysFromNow(def.daysOffset), def.hour),
        message: messages[def.msgIdx % messages.length],
        status: 'pending',
        feedback: '',
      });
    });

    // Confirmed showings (6) — also upcoming
    const confirmedDefs = [
      { daysOffset: 3,  hour: 9,  buyerIdx: 15, msgIdx: 2 },
      { daysOffset: 5,  hour: 11, buyerIdx: 16, msgIdx: 4 },
      { daysOffset: 7,  hour: 14, buyerIdx: 17, msgIdx: 6 },
      { daysOffset: 9,  hour: 10, buyerIdx: 18, msgIdx: 8 },
      { daysOffset: 11, hour: 15, buyerIdx: 19, msgIdx: 10 },
      { daysOffset: 13, hour: 13, buyerIdx: 20, msgIdx: 12 },
    ];

    confirmedDefs.forEach((def, i) => {
      const listing = upcomingListings[(i + 5) % upcomingListings.length];
      const buyer = buyers[def.buyerIdx];
      showingsData.push({
        listing: listing._id,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        preferredDate: withTime(daysFromNow(def.daysOffset), def.hour),
        message: messages[def.msgIdx % messages.length],
        status: 'confirmed',
        feedback: '',
      });
    });

    // Completed showings (past dates).
    // Mongoose 9 insertMany always runs document-level validators, so we bypass
    // the preferredDate > now validator using the raw MongoDB collection driver.
    const soldListings = allListings.filter((l) => l.status === 'sold');
    const completedSource = [...soldListings, ...activeListings];

    const completedDefs = [
      { daysAgoOffset: 5,  hour: 10, buyerIdx: 21, msgIdx: 0,  fbIdx: 0 },
      { daysAgoOffset: 8,  hour: 14, buyerIdx: 22, msgIdx: 3,  fbIdx: 1 },
      { daysAgoOffset: 12, hour: 11, buyerIdx: 23, msgIdx: 6,  fbIdx: 2 },
      { daysAgoOffset: 15, hour: 13, buyerIdx: 24, msgIdx: 9,  fbIdx: 3 },
      { daysAgoOffset: 20, hour: 10, buyerIdx: 0,  msgIdx: 12, fbIdx: 4 },
      { daysAgoOffset: 25, hour: 15, buyerIdx: 1,  msgIdx: 1,  fbIdx: 5 },
      { daysAgoOffset: 30, hour: 11, buyerIdx: 2,  msgIdx: 4,  fbIdx: 6 },
      { daysAgoOffset: 35, hour: 14, buyerIdx: 3,  msgIdx: 7,  fbIdx: 7 },
    ];

    const pastShowingDocs = [];

    completedDefs.forEach((def, i) => {
      const listing = completedSource[i % completedSource.length];
      const buyer = buyers[def.buyerIdx];
      pastShowingDocs.push({
        listing: listing._id,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        preferredDate: withTime(daysAgo(def.daysAgoOffset), def.hour),
        message: messages[def.msgIdx % messages.length],
        status: 'completed',
        feedback: feedbacks[def.fbIdx % feedbacks.length],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Cancelled showings (past)
    const cancelledDefs = [
      { daysAgoOffset: 7,  hour: 10, buyerIdx: 4, msgIdx: 2 },
      { daysAgoOffset: 18, hour: 13, buyerIdx: 5, msgIdx: 5 },
      { daysAgoOffset: 28, hour: 15, buyerIdx: 6, msgIdx: 8 },
    ];

    cancelledDefs.forEach((def, i) => {
      const listing = activeListings[i % activeListings.length];
      const buyer = buyers[def.buyerIdx];
      pastShowingDocs.push({
        listing: listing._id,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        preferredDate: withTime(daysAgo(def.daysAgoOffset), def.hour),
        message: messages[def.msgIdx % messages.length],
        status: 'cancelled',
        feedback: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Future showings (pending + confirmed) go through Mongoose for full validation
    const createdFuture = await Showing.insertMany(showingsData);
    // Past showings bypass the preferredDate validator via the raw driver
    await Showing.collection.insertMany(pastShowingDocs);

    const createdShowings = await Showing.find({});
    console.log(`Created ${createdShowings.length} showings (${createdFuture.length} future, ${pastShowingDocs.length} historical).`);

    // Create notifications for each agent whose listing has a new pending or confirmed showing
    const notifications = [];
    for (const showing of createdShowings) {
      if (showing.status !== 'pending' && showing.status !== 'confirmed') continue;

      const listing = allListings.find((l) => l._id.equals(showing.listing));
      if (!listing || !listing.createdBy) continue;

      notifications.push({
        recipient: listing.createdBy,
        type: 'showing_request',
        message: `${showing.name} requested a showing for ${listing.address}`,
        relatedShowing: showing._id,
        relatedListing: listing._id,
        isRead: false,
      });
    }

    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`Created ${createdNotifications.length} notifications.`);

    // Summary
    const statusCounts = createdShowings.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    const uniqueListings = new Set(createdShowings.map((s) => s.listing.toString())).size;

    console.log('\n--- Seed Summary ---');
    console.log(`Total showings:      ${createdShowings.length}`);
    console.log(`Statuses:            ${JSON.stringify(statusCounts)}`);
    console.log(`Unique listings:     ${uniqueListings}`);
    console.log(`Notifications:       ${createdNotifications.length}`);
    console.log(`Date range:          ${new Date(Math.min(...createdShowings.map(s => s.preferredDate))).toLocaleDateString()} – ${new Date(Math.max(...createdShowings.map(s => s.preferredDate))).toLocaleDateString()}`);
    console.log('\nTest login: margaret.holloway@novarealty.com / password123');
    console.log('Showings seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seed();
