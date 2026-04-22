import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import { connectDB } from '../config/db.js';

// Max offset in degrees (~800m radius)
const MAX_OFFSET = 0.008;

function jitter() {
  // Random point within a circle for natural spread
  const angle = Math.random() * 2 * Math.PI;
  const radius = Math.sqrt(Math.random()) * MAX_OFFSET;
  return radius * (Math.random() > 0.5 ? Math.cos(angle) : Math.sin(angle));
}

async function run() {
  try {
    await connectDB();

    const listings = await Listing.find({
      'location.coordinates': { $exists: true, $ne: [] }
    }).select('_id location');

    // Group by rounded coordinates
    const groups = {};
    for (const l of listings) {
      const [lng, lat] = l.location.coordinates;
      const key = `${lng.toFixed(3)},${lat.toFixed(3)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(l);
    }

    const duplicateGroups = Object.values(groups).filter(g => g.length > 1);
    console.log(`Found ${duplicateGroups.length} groups with duplicate coordinates.`);

    let updated = 0;
    for (const group of duplicateGroups) {
      // Leave first listing in place, jitter the rest
      for (let i = 1; i < group.length; i++) {
        const [lng, lat] = group[i].location.coordinates;
        await Listing.findByIdAndUpdate(group[i]._id, {
          $set: {
            'location.coordinates': [lng + jitter(), lat + jitter()]
          }
        });
        updated++;
      }
    }

    console.log(`Done. Spread ${updated} listings.`);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
