import 'dotenv/config';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';
import { connectDB } from '../config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CSV_PATH = join(__dirname, '../seeds/realtor-data.zip.csv');
const LIMIT = parseInt(process.env.IMPORT_LIMIT ?? '500', 10);
const STATE_FILTER = process.env.IMPORT_STATE ?? null;
const CITY_FILTER = process.env.IMPORT_CITY ?? null;
const BATCH_SIZE = 100;

const STATUS_MAP = {
  for_sale: 'active',
  sold: 'sold',
  for_rent: 'inactive',
  ready_to_build: 'inactive',
};

const STREET_NAMES = [
  'Oak St', 'Maple Ave', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Walnut Dr',
  'Birch Blvd', 'Willow Way', 'Hickory Ct', 'Chestnut St', 'Poplar Ave',
  'Magnolia Dr', 'Dogwood Ln', 'Peachtree Rd', 'Sycamore St', 'Ash Ave',
  'Laurel Blvd', 'Cypress Dr', 'Spruce St', 'Linden Ln', 'Mulberry Ct',
  'Hawthorn Way', 'Redwood Dr', 'Sumac St', 'Holly Ave', 'Locust Rd',
  'Beech Blvd', 'Juniper Ln', 'Aspen Ct', 'Cottonwood Dr', 'Maplewood Ave',
  'Riverside Dr', 'Hillcrest Rd', 'Meadow Ln', 'Sunset Blvd', 'Lake View Dr',
  'Forest Ave', 'Valley Rd', 'Creek St', 'Orchard Way', 'Ridge Rd',
];

function randomStreet(seed) {
  const num = 100 + (Math.abs(seed) % 9800);
  const name = STREET_NAMES[Math.abs(seed) % STREET_NAMES.length];
  return `${num} ${name}`;
}

function padZip(raw) {
  if (!raw) return null;
  const z = raw.trim().replace(/\.0$/, '');
  if (!/^\d+$/.test(z)) return null;
  const padded = z.padStart(5, '0');
  return /^\d{5}(-\d{4})?$/.test(padded) ? padded : null;
}

function parseRow(headers, parts) {
  const row = {};
  headers.forEach((h, i) => { row[h] = (parts[i] ?? '').trim(); });

  const price = parseFloat(row.price);
  const squareFeet = parseFloat(row.house_size);
  const zipCode = padZip(row.zip_code);
  const status = STATUS_MAP[row.status] ?? 'active';

  if (!price || isNaN(price)) return null;
  if (!squareFeet || isNaN(squareFeet)) return null;
  if (!zipCode) return null;

  const city = row.city || '';
  const state = row.state || '';
  const streetSeed = parseInt(row.street?.replace(/\.0$/, '') || '0', 10);
  const street = randomStreet(streetSeed);
  const address = `${street}, ${[city, state, zipCode].filter(Boolean).join(', ')}`;

  const descParts = [];
  if (row.bed) descParts.push(`${parseInt(row.bed)} bed`);
  if (row.bath) descParts.push(`${parseInt(row.bath)} bath`);
  if (row.acre_lot) descParts.push(`${parseFloat(row.acre_lot)} acre lot`);
  const description = descParts.join(' · ') || undefined;

  const listing = { price, address, squareFeet, zipCode, status, description };

  if (row.prev_sold_date && status === 'sold') {
    const d = new Date(row.prev_sold_date);
    if (!isNaN(d.getTime())) listing.closingDate = d;
  }

  return listing;
}

async function run() {
  try {
    await connectDB();

    const CLEAR = process.env.IMPORT_CLEAR === 'true';
    const existing = await Listing.countDocuments();
    if (CLEAR && existing > 0) {
      console.log(`Clearing ${existing} existing listing(s)...`);
      await Listing.deleteMany({});
    } else if (existing > 0) {
      console.log(`Keeping ${existing} existing listing(s), appending new ones.`);
    }

    const agents = await Agent.find({ isActive: true });
    if (!agents.length) console.warn('No active agents found — createdBy will be unset.');

    const rl = createInterface({ input: createReadStream(CSV_PATH), crlfDelay: Infinity });

    let headers = null;
    let batch = [];
    let inserted = 0;
    let skipped = 0;
    let agentIndex = 0;

    for await (const line of rl) {
      if (!headers) {
        headers = line.split(',').map(h => h.trim());
        continue;
      }

      if (inserted + batch.length >= LIMIT) break;

      const parts = line.split(',');
      const listing = parseRow(headers, parts);

      if (!listing) { skipped++; continue; }
      if (STATE_FILTER && !listing.address.toLowerCase().includes(STATE_FILTER.toLowerCase())) { skipped++; continue; }
      if (CITY_FILTER && !listing.address.toLowerCase().includes(CITY_FILTER.toLowerCase())) { skipped++; continue; }

      if (agents.length) {
        listing.createdBy = agents[agentIndex % agents.length]._id;
        agentIndex++;
      }

      batch.push(listing);

      if (batch.length >= BATCH_SIZE) {
        await Listing.insertMany(batch, { ordered: false });
        inserted += batch.length;
        console.log(`Inserted ${inserted} / ${LIMIT}...`);
        batch = [];
      }
    }

    if (batch.length) {
      await Listing.insertMany(batch, { ordered: false });
      inserted += batch.length;
    }

    console.log(`Done. Inserted: ${inserted}, Skipped (invalid): ${skipped}`);
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
