import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import { connectDB } from '../config/db.js';

const TOKEN = process.env.MAPBOX_TOKEN;

// Full continental US bounds
const BOUNDS = { minLat: 25.0, maxLat: 49.0, minLng: -124.5, maxLng: -66.5 };

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function randomPoint() {
  return {
    lat: BOUNDS.minLat + Math.random() * (BOUNDS.maxLat - BOUNDS.minLat),
    lng: BOUNDS.minLng + Math.random() * (BOUNDS.maxLng - BOUNDS.minLng),
  };
}

async function reverseGeocode(lat, lng) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address&access_token=${TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox error ${res.status}`);
  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  const zip = feature.context?.find(c => c.id.startsWith('postcode'))?.text;
  if (!zip) return null;

  return {
    address: feature.place_name,
    zipCode: zip.slice(0, 5),
    coordinates: feature.center,
  };
}

async function run() {
  try {
    await connectDB();

    const listings = await Listing.find({}).select('_id');
    const total = listings.length;
    console.log(`Need ${total} real addresses across the US. Fetching from Mapbox...`);

    const pool = [];
    const seen = new Set();
    let attempts = 0;

    while (pool.length < total && attempts < total * 4) {
      const { lat, lng } = randomPoint();
      const result = await reverseGeocode(lat, lng);
      attempts++;

      if (result && !seen.has(result.address)) {
        seen.add(result.address);
        pool.push(result);
        if (pool.length % 50 === 0) console.log(`  Got ${pool.length} / ${total} addresses...`);
      }

      await sleep(50);
    }

    console.log(`Collected ${pool.length} unique addresses. Updating listings...`);

    let updated = 0;
    for (let i = 0; i < listings.length; i++) {
      const addr = pool[i % pool.length];
      await Listing.findByIdAndUpdate(listings[i]._id, {
        $set: {
          address: addr.address,
          zipCode: addr.zipCode,
          location: { type: 'Point', coordinates: addr.coordinates },
        }
      });
      updated++;
      if (updated % 100 === 0) console.log(`Updated ${updated} / ${total}`);
    }

    console.log(`Done. ${updated} listings updated.`);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
