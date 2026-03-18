import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Showing from '../models/Showing.js';
import Notification from '../models/Notification.js';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';

async function seed() {
  try {
    await connectDB();

    // Clear existing showings and notifications
    await Showing.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing showings and notifications.');

    // Find John Smith specifically, or fall back to first active agent
    const agent = await Agent.findOne({ email: 'john@example.com', isActive: true })
      || await Agent.findOne({ isActive: true });
    if (!agent) {
      console.error('No active agents found. Run seed:agents first.');
      process.exit(1);
    }
    console.log(`Using agent: ${agent.name} (${agent.email})`);

    // Get 3 active listings and assign them to this agent
    const listings = await Listing.find({ status: 'active' }).limit(3);
    if (listings.length < 3) {
      console.error('Need at least 3 active listings. Run seed (seedListings) first.');
      process.exit(1);
    }

    // Assign all 3 listings to this agent so showings will appear for them
    for (const listing of listings) {
      listing.createdBy = agent._id;
      await listing.save();
    }
    console.log(`Assigned ${listings.length} listings to ${agent.name}.`);

    // Create 3 mock showing requests — each on a different listing
    const showingsData = [
      {
        listing: listings[0]._id,
        name: 'Alice Martinez',
        email: 'alice.martinez@email.com',
        phone: '(555) 234-5678',
        preferredDate: new Date('2026-04-15T10:00:00'),
        message: 'Very interested in this property! Would love to see it in person this weekend.',
        status: 'pending',
      },
      {
        listing: listings[1]._id,
        name: 'Bob Chen',
        email: 'bob.chen@email.com',
        phone: '(555) 876-5432',
        preferredDate: new Date('2026-04-18T14:30:00'),
        message: 'My family is relocating to the area. Can we schedule a tour?',
        status: 'confirmed',
      },
      {
        listing: listings[2]._id,
        name: 'Carol Davis',
        email: 'carol.davis@email.com',
        phone: '(555) 345-6789',
        preferredDate: new Date('2026-04-20T11:00:00'),
        message: 'Saw this listing online and love the neighborhood.',
        status: 'pending',
      },
    ];

    const createdShowings = await Showing.create(showingsData);
    console.log(`Created ${createdShowings.length} showings.`);

    // Create notifications for the agent
    const notifications = createdShowings.map((showing, i) => ({
      recipient: agent._id,
      type: 'showing_request',
      message: `${showing.name} requested a tour for ${listings[i].address}`,
      relatedShowing: showing._id,
      relatedListing: listings[i]._id,
      isRead: false,
    }));

    const createdNotifications = await Notification.create(notifications);
    console.log(`Created ${createdNotifications.length} notifications.`);

    // Print summary
    console.log('\n--- Seed Summary ---');
    console.log(`Agent: ${agent.name} (${agent.email})`);
    console.log(`Login: ${agent.email} / password123\n`);
    createdShowings.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name} (${s.status})`);
      console.log(`   Property: ${listings[i].address}`);
      console.log(`   Email: ${s.email} | Phone: ${s.phone}`);
      console.log(`   Date: ${s.preferredDate.toLocaleDateString()}`);
      console.log('');
    });

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
