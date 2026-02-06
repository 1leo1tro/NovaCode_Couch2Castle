import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import { connectDB } from '../config/db.js';

/**
 * Seed data covering diverse edge cases:
 * - Price range: $50,000 to $5,000,000
 * - Square footage: 500 to 10,000 sqft
 * - Multiple ZIP codes (5-digit and 5+4 formats)
 * - All four statuses: active, pending, sold, inactive
 * - Boundary values for price and square footage
 * - Various image array states (empty, single, multiple)
 */
const seedListings = [
  // --- LOW PRICE RANGE ($50k-$150k) ---
  {
    price: 50000,
    address: '101 Budget Ln, Huntsville, AL 35801',
    squareFeet: 500,
    images: [],
    status: 'active',
    zipCode: '35801'
  },
  {
    price: 75000,
    address: '202 Starter Ave, Decatur, AL 35601',
    squareFeet: 750,
    images: ['https://example.com/img1.jpg'],
    status: 'inactive',
    zipCode: '35601'
  },
  {
    price: 120000,
    address: '303 Economy Dr, Madison, AL 35758',
    squareFeet: 900,
    images: [],
    status: 'pending',
    zipCode: '35758'
  },
  {
    price: 149999,
    address: '404 Thrift Blvd, Athens, AL 35611',
    squareFeet: 1100,
    images: ['https://example.com/img2.jpg', 'https://example.com/img3.jpg'],
    status: 'sold',
    zipCode: '35611'
  },

  // --- MID-LOW PRICE RANGE ($150k-$300k) ---
  {
    price: 150000,
    address: '505 Maple St, Huntsville, AL 35802',
    squareFeet: 1200,
    images: [],
    status: 'active',
    zipCode: '35802'
  },
  {
    price: 199999,
    address: '606 Cedar Ct, Madison, AL 35757',
    squareFeet: 1400,
    images: ['https://example.com/img4.jpg'],
    status: 'active',
    zipCode: '35757'
  },
  {
    price: 250000,
    address: '707 Elm Way, Huntsville, AL 35803',
    squareFeet: 1600,
    images: ['https://example.com/img5.jpg', 'https://example.com/img6.jpg'],
    status: 'pending',
    zipCode: '35803'
  },
  {
    price: 275000,
    address: '808 Birch Rd, Decatur, AL 35603',
    squareFeet: 1800,
    images: [],
    status: 'active',
    zipCode: '35603'
  },

  // --- MID PRICE RANGE ($300k-$500k) ---
  {
    price: 300000,
    address: '909 Oakwood Dr, Huntsville, AL 35801',
    squareFeet: 2000,
    images: ['https://example.com/img7.jpg'],
    status: 'sold',
    zipCode: '35801'
  },
  {
    price: 350000,
    address: '1010 Willow Ln, Madison, AL 35758',
    squareFeet: 2200,
    images: [
      'https://example.com/img8.jpg',
      'https://example.com/img9.jpg',
      'https://example.com/img10.jpg'
    ],
    status: 'active',
    zipCode: '35758'
  },
  {
    price: 425000,
    address: '1111 Pine Crest Ave, Huntsville, AL 35802',
    squareFeet: 2500,
    images: [],
    status: 'inactive',
    zipCode: '35802'
  },
  {
    price: 499999,
    address: '1212 Spruce Ct, Athens, AL 35611',
    squareFeet: 2800,
    images: ['https://example.com/img11.jpg'],
    status: 'pending',
    zipCode: '35611'
  },

  // --- MID-HIGH PRICE RANGE ($500k-$1M) ---
  {
    price: 500000,
    address: '1313 Magnolia Blvd, Huntsville, AL 35806',
    squareFeet: 3000,
    images: [
      'https://example.com/img12.jpg',
      'https://example.com/img13.jpg'
    ],
    status: 'active',
    zipCode: '35806'
  },
  {
    price: 650000,
    address: '1414 Dogwood Trl, Madison, AL 35757',
    squareFeet: 3500,
    images: [],
    status: 'sold',
    zipCode: '35757'
  },
  {
    price: 800000,
    address: '1515 Hickory Hill Rd, Huntsville, AL 35802',
    squareFeet: 4000,
    images: ['https://example.com/img14.jpg'],
    status: 'active',
    zipCode: '35802'
  },
  {
    price: 999999,
    address: '1616 Sycamore Ln, Huntsville, AL 35801',
    squareFeet: 4500,
    images: [
      'https://example.com/img15.jpg',
      'https://example.com/img16.jpg',
      'https://example.com/img17.jpg',
      'https://example.com/img18.jpg'
    ],
    status: 'inactive',
    zipCode: '35801'
  },

  // --- HIGH PRICE RANGE ($1M-$5M) ---
  {
    price: 1000000,
    address: '1717 Lakeview Estates Dr, Huntsville, AL 35803',
    squareFeet: 5000,
    images: ['https://example.com/img19.jpg'],
    status: 'active',
    zipCode: '35803'
  },
  {
    price: 1500000,
    address: '1818 Summit Ridge Way, Madison, AL 35758',
    squareFeet: 6000,
    images: [
      'https://example.com/img20.jpg',
      'https://example.com/img21.jpg'
    ],
    status: 'pending',
    zipCode: '35758'
  },
  {
    price: 2500000,
    address: '1919 Grand Manor Ct, Huntsville, AL 35806',
    squareFeet: 8000,
    images: [
      'https://example.com/img22.jpg',
      'https://example.com/img23.jpg',
      'https://example.com/img24.jpg'
    ],
    status: 'active',
    zipCode: '35806'
  },
  {
    price: 5000000,
    address: '2020 Prestige Pointe Dr, Huntsville, AL 35802',
    squareFeet: 10000,
    images: [
      'https://example.com/img25.jpg',
      'https://example.com/img26.jpg',
      'https://example.com/img27.jpg',
      'https://example.com/img28.jpg',
      'https://example.com/img29.jpg'
    ],
    status: 'active',
    zipCode: '35802'
  },

  // --- EDGE CASES ---

  // Minimum boundary values
  {
    price: 0,
    address: '2121 Freehold Rd, Decatur, AL 35601',
    squareFeet: 0,
    images: [],
    status: 'inactive',
    zipCode: '35601'
  },

  // ZIP+4 format
  {
    price: 325000,
    address: '2222 Postal Way, Huntsville, AL 35801-1234',
    squareFeet: 2100,
    images: ['https://example.com/img30.jpg'],
    status: 'active',
    zipCode: '35801-1234'
  },

  // Another ZIP+4 format
  {
    price: 475000,
    address: '2323 Extended Zip Ct, Madison, AL 35758-5678',
    squareFeet: 2700,
    images: [],
    status: 'pending',
    zipCode: '35758-5678'
  },

  // Very high square footage with low price (unusual ratio)
  {
    price: 85000,
    address: '2424 Warehouse District Rd, Decatur, AL 35603',
    squareFeet: 8000,
    images: [],
    status: 'active',
    zipCode: '35603'
  },

  // Very low square footage with high price (unusual ratio)
  {
    price: 750000,
    address: '2525 Penthouse Ct, Huntsville, AL 35806',
    squareFeet: 600,
    images: [
      'https://example.com/img31.jpg',
      'https://example.com/img32.jpg'
    ],
    status: 'active',
    zipCode: '35806'
  }
];

async function seed() {
  try {
    await connectDB();

    const existingCount = await Listing.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} listing(s).`);
      console.log('Clearing existing listings before seeding...');
      await Listing.deleteMany({});
      console.log('Existing listings removed.');
    }

    const inserted = await Listing.insertMany(seedListings);
    console.log(`Successfully seeded ${inserted.length} listings.`);

    // Print summary
    const statusCounts = inserted.reduce((acc, listing) => {
      acc[listing.status] = (acc[listing.status] || 0) + 1;
      return acc;
    }, {});
    const uniqueZips = [...new Set(inserted.map((l) => l.zipCode))];
    const prices = inserted.map((l) => l.price);
    const sqfts = inserted.map((l) => l.squareFeet);

    console.log('\n--- Seed Summary ---');
    console.log(`Total listings: ${inserted.length}`);
    console.log(`Statuses: ${JSON.stringify(statusCounts)}`);
    console.log(`Unique ZIP codes: ${uniqueZips.length} (${uniqueZips.join(', ')})`);
    console.log(`Price range: $${Math.min(...prices).toLocaleString()} - $${Math.max(...prices).toLocaleString()}`);
    console.log(`SqFt range: ${Math.min(...sqfts).toLocaleString()} - ${Math.max(...sqfts).toLocaleString()}`);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seed();
