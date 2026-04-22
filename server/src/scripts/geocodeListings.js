import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import { connectDB } from '../config/db.js';

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) {
  console.error('MAPBOX_TOKEN is not set in .env');
  process.exit(1);
}

const BATCH_SIZE = 10;
const DELAY_MS = 120; // ~8 req/sec, well under Mapbox free tier limits

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function geocode(address) {
  const query = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=place,address,postcode`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox error ${res.status}`);
  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;
  return feature.center; // [lng, lat]
}

async function run() {
  try {
    await connectDB();

    const listings = await Listing.find({
      $or: [
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates': { $size: 0 } },
      ]
    }).select('_id address zipCode');

    console.log(`Found ${listings.length} listings without coordinates.`);

    let updated = 0;
    let failed = 0;

    for (let i = 0; i < listings.length; i += BATCH_SIZE) {
      const batch = listings.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (listing) => {
        try {
          const coords = await geocode(listing.address);
          if (!coords) { failed++; return; }

          await Listing.findByIdAndUpdate(listing._id, {
            $set: { location: { type: 'Point', coordinates: coords } }
          });
          updated++;
        } catch {
          failed++;
        }
      }));

      console.log(`Progress: ${Math.min(i + BATCH_SIZE, listings.length)} / ${listings.length}`);
      if (i + BATCH_SIZE < listings.length) await sleep(DELAY_MS * BATCH_SIZE);
    }

    console.log(`Done. Updated: ${updated}, Failed/not found: ${failed}`);
  } catch (err) {
    console.error('Geocoding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
