import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';
import { connectDB } from '../config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  try {
    await connectDB();

    // Clear all existing listings
    const count = await Listing.countDocuments();
    console.log(`Clearing ${count} existing listing(s)...`);
    await Listing.deleteMany({});

    // Load JSON
    const raw = readFileSync(join(__dirname, 'seed_listings.json'), 'utf8');
    const listings = JSON.parse(raw);

    // Assign agents round-robin
    const agents = await Agent.find({ isActive: true });
    if (!agents.length) console.warn('No active agents found — createdBy will be unset.');

    const enriched = listings.map((l, i) => ({
      ...l,
      createdBy: agents.length ? agents[i % agents.length]._id : undefined,
    }));

    const inserted = await Listing.insertMany(enriched);
    console.log(`Inserted ${inserted.length} listings.`);
    inserted.forEach(l => console.log(' -', l.address));
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
