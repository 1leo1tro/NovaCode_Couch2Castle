import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import { connectDB } from '../config/db.js';

// description format: "3 bed · 2 bath · 0.12 acre lot"
function parse(description) {
  if (!description) return {};
  const bed = description.match(/(\d+)\s*bed/);
  const bath = description.match(/(\d+)\s*bath/);
  return {
    bedrooms: bed ? parseInt(bed[1]) : undefined,
    bathrooms: bath ? parseInt(bath[1]) : undefined,
  };
}

async function run() {
  try {
    await connectDB();

    const listings = await Listing.find({ bedrooms: { $exists: false } }).select('_id description');
    console.log(`Backfilling ${listings.length} listings...`);

    let updated = 0;
    const BATCH = 200;

    for (let i = 0; i < listings.length; i += BATCH) {
      const batch = listings.slice(i, i + BATCH);
      await Promise.all(batch.map(l => {
        const { bedrooms, bathrooms } = parse(l.description);
        if (bedrooms === undefined && bathrooms === undefined) return Promise.resolve();
        return Listing.findByIdAndUpdate(l._id, { $set: { bedrooms, bathrooms } });
      }));
      updated += batch.length;
      console.log(`Updated ${Math.min(updated, listings.length)} / ${listings.length}`);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
