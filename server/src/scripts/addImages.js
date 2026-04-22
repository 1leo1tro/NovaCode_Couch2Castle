import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import { connectDB } from '../config/db.js';

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!UNSPLASH_KEY) {
  console.error('UNSPLASH_ACCESS_KEY not set in .env');
  process.exit(1);
}

const QUERIES = [
  'house exterior', 'real estate home', 'suburban house', 'american home', 'residential house',
  'modern house', 'colonial home', 'craftsman house', 'ranch house', 'brick house',
  'luxury home exterior', 'family home', 'two story house', 'cottage house', 'farmhouse exterior',
  'victorian house', 'contemporary home', 'bungalow house', 'tudor house', 'cape cod house',
  'mediterranean house', 'spanish style home', 'split level house', 'mid century modern home',
  'white house exterior', 'gray house exterior', 'blue house exterior', 'stone house exterior',
  'house front porch', 'house garage exterior', 'townhouse exterior', 'duplex house',
  'new construction home', 'single family home', 'green house exterior', 'yellow house exterior',
  'house driveway', 'house landscaping', 'house backyard', 'neighborhood homes',
];

async function fetchPhotoPool() {
  const pool = [];
  for (const query of QUERIES) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30&orientation=landscape&client_id=${UNSPLASH_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Unsplash error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    for (const photo of data.results) {
      pool.push(photo.urls.regular);
    }
  }
  // Deduplicate
  return [...new Set(pool)];
}

function pickImages(pool, seed) {
  const seen = new Set();
  const result = [];
  let s = seed;
  while (result.length < 5 && seen.size < pool.length) {
    const x = Math.sin(s++) * 10000;
    const idx = Math.abs(Math.floor((x - Math.floor(x)) * pool.length)) % pool.length;
    const url = pool[idx];
    if (!seen.has(url)) {
      seen.add(url);
      result.push(url);
    }
  }
  return result;
}

async function run() {
  try {
    await connectDB();

    console.log('Fetching house photos from Unsplash...');
    const pool = await fetchPhotoPool();
    console.log(`Got ${pool.length} unique photos.`);

    const listings = await Listing.find({}).select('_id');
    console.log(`Updating ${listings.length} listings...`);

    const BATCH = 200;
    let updated = 0;

    for (let i = 0; i < listings.length; i += BATCH) {
      const batch = listings.slice(i, i + BATCH);
      await Promise.all(batch.map((listing, j) => {
        const seed = parseInt(listing._id.toString().slice(-6), 16) + j;
        return Listing.findByIdAndUpdate(listing._id, { $set: { images: pickImages(pool, seed) } });
      }));
      updated += batch.length;
      console.log(`Updated ${updated} / ${listings.length}`);
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
