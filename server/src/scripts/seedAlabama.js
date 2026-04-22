import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';
import { connectDB } from '../config/db.js';

// All coordinates are [longitude, latitude] (GeoJSON format)
// Huntsville metro area — spread across real neighborhoods

const imgs = {
  budget: [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ],
  mid: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
  ],
  luxury: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
    'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  ],
};

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const listings = [
  // ── DOWNTOWN / BLOSSOMWOOD (35801) ─────────────────────────────────────
  {
    price: 379000,
    address: '204 Blossomwood Dr NW, Huntsville, AL 35801',
    description: 'Mid-century modern gem in coveted Blossomwood. Original hardwood floors, updated kitchen, and a sunlit screened porch overlooking a landscaped yard.',
    bedrooms: 3, bathrooms: 2, squareFeet: 2050,
    images: imgs.mid,
    status: 'active', zipCode: '35801',
    location: { type: 'Point', coordinates: [-86.5978, 34.7431] },
    tags: ['mid-century', 'hardwood floors', 'screened porch', 'Blossomwood'],
    viewCount: rnd(80, 200),
  },
  {
    price: 498500,
    address: '815 Governors Dr SW, Huntsville, AL 35801',
    description: 'Executive home in prestigious Governors Drive neighborhood. Formal dining, home office, primary suite with spa bath, and a resort-style pool.',
    bedrooms: 4, bathrooms: 3, squareFeet: 3400,
    images: imgs.luxury.slice(0, 3),
    status: 'active', zipCode: '35801',
    location: { type: 'Point', coordinates: [-86.5861, 34.7145] },
    tags: ['pool', 'home office', 'executive', 'spa bath'],
    viewCount: rnd(100, 250),
  },
  {
    price: 285000,
    address: '1102 Bankhead Pkwy NE, Huntsville, AL 35801',
    description: 'Split-level with stunning Monte Sano views. Updated kitchen, new deck, and a finished basement — perfect for entertaining.',
    bedrooms: 3, bathrooms: 2, squareFeet: 2200,
    images: imgs.mid.slice(0, 2),
    status: 'active', zipCode: '35801',
    location: { type: 'Point', coordinates: [-86.5541, 34.7380] },
    tags: ['mountain views', 'deck', 'finished basement', 'split level'],
    viewCount: rnd(70, 180),
  },

  // ── JONES VALLEY / SOUTH HUNTSVILLE (35803) ────────────────────────────
  {
    price: 189000,
    address: '412 Weatherly Rd, Huntsville, AL 35803',
    description: 'Charming 3-bed ranch-style home in established neighborhood. Newly painted interior, updated kitchen appliances, and a large fenced backyard.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1350,
    images: imgs.budget,
    status: 'active', zipCode: '35803',
    location: { type: 'Point', coordinates: [-86.5543, 34.6941] },
    tags: ['ranch', 'fenced yard', 'updated kitchen'],
    viewCount: rnd(40, 120),
  },
  {
    price: 229000,
    address: '3108 Whitesburg Dr S, Huntsville, AL 35803',
    description: 'Brick ranch in the heart of Jones Valley. New HVAC (2023), updated bathrooms, and a large corner lot with mature oaks.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1680,
    images: imgs.budget,
    status: 'active', zipCode: '35803',
    location: { type: 'Point', coordinates: [-86.5412, 34.6855] },
    tags: ['brick ranch', 'corner lot', 'Jones Valley', 'new HVAC'],
    viewCount: rnd(50, 130),
  },
  {
    price: 319000,
    address: '2006 Meadowbrook Dr SE, Huntsville, AL 35803',
    description: 'Spacious 4-bed split-level on a quiet cul-de-sac. Renovated kitchen with granite counters, sunroom addition, and a private backyard.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2480,
    images: imgs.mid,
    status: 'active', zipCode: '35803',
    location: { type: 'Point', coordinates: [-86.5263, 34.6991] },
    tags: ['cul-de-sac', 'sunroom', 'renovated kitchen', 'split level'],
    viewCount: rnd(60, 160),
  },

  // ── RESEARCH PARK / NW HUNTSVILLE (35806) ──────────────────────────────
  {
    price: 224900,
    address: '78 Walnut Grove Cir, Huntsville, AL 35806',
    description: 'Move-in ready home with open floor plan, vaulted ceilings, and a two-car garage. Quiet cul-de-sac near Research Park — ideal for tech professionals.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1640,
    images: imgs.budget,
    status: 'active', zipCode: '35806',
    location: { type: 'Point', coordinates: [-86.6478, 34.7268] },
    tags: ['cul-de-sac', 'garage', 'open floor plan', 'research park'],
    viewCount: rnd(55, 140),
  },
  {
    price: 275000,
    address: '4502 Triana Blvd SW, Huntsville, AL 35806',
    description: 'Updated 3-bed home in established NW neighborhood. New roof (2022), refinished hardwood floors, and a large screened back porch.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1820,
    images: imgs.mid.slice(0, 2),
    status: 'active', zipCode: '35806',
    location: { type: 'Point', coordinates: [-86.6390, 34.7311] },
    tags: ['hardwood floors', 'screened porch', 'new roof', 'established neighborhood'],
    viewCount: rnd(45, 120),
  },

  // ── NORTHEAST / LEGENDS CREEK (35824) ──────────────────────────────────
  {
    price: 315000,
    address: '540 Legends Creek Dr, Huntsville, AL 35824',
    description: 'Newer construction in gated Legends Creek. Energy-efficient windows, smart thermostat, and a chef\'s kitchen with quartz countertops.',
    bedrooms: 4, bathrooms: 2.5, squareFeet: 2380,
    images: imgs.mid,
    status: 'active', zipCode: '35824',
    location: { type: 'Point', coordinates: [-86.5183, 34.7804] },
    tags: ['gated', 'new construction', 'smart home', 'energy efficient'],
    viewCount: rnd(70, 180),
  },
  {
    price: 359000,
    address: '216 Discovery Dr NE, Huntsville, AL 35811',
    description: 'Beautifully maintained home in the popular Discovery area. Open concept main level, three-car garage, and a stunning backyard with built-in fire pit.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2750,
    images: imgs.mid,
    status: 'active', zipCode: '35811',
    location: { type: 'Point', coordinates: [-86.5071, 34.7593] },
    tags: ['three-car garage', 'fire pit', 'open concept'],
    viewCount: rnd(65, 170),
  },

  // ── MERIDIAN ST / CRAFTSMAN (35811) ────────────────────────────────────
  {
    price: 445000,
    address: '3317 Meridian St N, Huntsville, AL 35811',
    description: 'Renovated craftsman with original character intact. New roof (2023), updated HVAC, large workshop/garage, and mature shade trees lining the property.',
    bedrooms: 4, bathrooms: 2, squareFeet: 2900,
    images: imgs.mid,
    status: 'pending', zipCode: '35811',
    location: { type: 'Point', coordinates: [-86.5736, 34.7842] },
    tags: ['craftsman', 'renovated', 'workshop', 'new roof'],
    viewCount: rnd(90, 220),
  },

  // ── HAMPTON COVE (35763) ────────────────────────────────────────────────
  {
    price: 267500,
    address: '1903 Hampton Cove Pkwy, Owens Cross Roads, AL 35763',
    description: 'Spacious home in sought-after Hampton Cove backing to a greenbelt. Granite countertops, hardwood floors, and a covered back porch.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2100,
    images: imgs.mid.slice(0, 3),
    status: 'active', zipCode: '35763',
    location: { type: 'Point', coordinates: [-86.4592, 34.7612] },
    tags: ['greenbelt', 'hardwood floors', 'granite countertops', 'Hampton Cove'],
    viewCount: rnd(50, 140),
  },
  {
    price: 489000,
    address: '104 Windmill Ln, Owens Cross Roads, AL 35763',
    description: 'Custom-built estate home in Hampton Cove golf community. Formal dining, sunroom, primary suite with sitting room, and an outdoor kitchen.',
    bedrooms: 5, bathrooms: 4, squareFeet: 3900,
    images: imgs.luxury.slice(0, 3),
    status: 'active', zipCode: '35763',
    location: { type: 'Point', coordinates: [-86.4478, 34.7698] },
    tags: ['golf community', 'outdoor kitchen', 'sunroom', 'custom built'],
    viewCount: rnd(80, 200),
  },

  // ── MADISON (35758) ─────────────────────────────────────────────────────
  {
    price: 338000,
    address: '112 Patriot Dr, Madison, AL 35758',
    description: 'Better-than-new in award-winning Liberty neighborhood. Covered front porch, open kitchen overlooking family room, and a private backyard with garden beds.',
    bedrooms: 4, bathrooms: 2.5, squareFeet: 2300,
    images: imgs.mid,
    status: 'active', zipCode: '35758',
    location: { type: 'Point', coordinates: [-86.7483, 34.6992] },
    tags: ['Liberty', 'front porch', 'garden', 'Madison City Schools'],
    viewCount: rnd(70, 180),
  },
  {
    price: 289000,
    address: '806 Gallatin Way, Madison, AL 35758',
    description: 'Clean 3-bed, 2-bath in established Madison neighborhood. New paint inside and out, updated fixtures, and a large flat lot.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1750,
    images: imgs.budget,
    status: 'active', zipCode: '35758',
    location: { type: 'Point', coordinates: [-86.7312, 34.7041] },
    tags: ['Madison', 'flat lot', 'updated fixtures'],
    viewCount: rnd(45, 110),
  },
  {
    price: 412000,
    address: '24 Ashbury Ln, Madison, AL 35756',
    description: 'Stunning 4-bedroom home in exclusive Ashbury subdivision. Coffered ceilings, chef\'s kitchen with double ovens, and a bonus room upstairs.',
    bedrooms: 4, bathrooms: 3, squareFeet: 3100,
    images: imgs.luxury.slice(0, 3),
    status: 'active', zipCode: '35756',
    location: { type: 'Point', coordinates: [-86.7680, 34.7102] },
    tags: ['coffered ceilings', 'chef kitchen', 'bonus room', 'Ashbury'],
    viewCount: rnd(75, 190),
  },

  // ── HARVEST / MERIDIANVILLE (35749 / 35759) ─────────────────────────────
  {
    price: 248000,
    address: '18 Crescent Bluff Dr, Harvest, AL 35749',
    description: 'Immaculate 3-bed home in Harvest. Vaulted great room, eat-in kitchen, and a fully fenced yard with a storage shed.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1580,
    images: imgs.budget,
    status: 'active', zipCode: '35749',
    location: { type: 'Point', coordinates: [-86.5736, 34.8543] },
    tags: ['vaulted ceilings', 'fenced yard', 'storage shed', 'Harvest'],
    viewCount: rnd(35, 100),
  },
  {
    price: 299000,
    address: '53 Timber Trace Rd, Meridianville, AL 35759',
    description: 'Newer 4-bed home on a half-acre lot in quiet Meridianville. Large covered back porch, three-car garage, and a bonus room.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2620,
    images: imgs.mid.slice(0, 3),
    status: 'active', zipCode: '35759',
    location: { type: 'Point', coordinates: [-86.5612, 34.8712] },
    tags: ['half-acre', 'three-car garage', 'bonus room', 'Meridianville'],
    viewCount: rnd(40, 110),
  },

  // ── MONTE SANO / EAST HUNTSVILLE (35801 / 35810) ───────────────────────
  {
    price: 565000,
    address: '3104 Monte Sano Blvd SE, Huntsville, AL 35801',
    description: 'Stately home atop Monte Sano with panoramic valley views. Four bedrooms, a sunken living room, wrap-around deck, and a guest cottage.',
    bedrooms: 4, bathrooms: 3, squareFeet: 3600,
    images: imgs.luxury,
    status: 'active', zipCode: '35801',
    location: { type: 'Point', coordinates: [-86.5234, 34.7459] },
    tags: ['mountain views', 'wrap-around deck', 'guest cottage', 'Monte Sano'],
    viewCount: rnd(110, 280),
  },
  {
    price: 175000,
    address: '4208 Pulaski Pike NW, Huntsville, AL 35810',
    description: 'Solid brick ranch priced to move. New roof and windows. Open living/dining, two-car carport, and a large backyard.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1240,
    images: imgs.budget.slice(0, 2),
    status: 'active', zipCode: '35810',
    location: { type: 'Point', coordinates: [-86.6021, 34.7903] },
    tags: ['brick ranch', 'new roof', 'carport', 'value'],
    viewCount: rnd(30, 90),
  },

  // ── RECENTLY SOLD (for market data / history) ───────────────────────────
  {
    price: 325000,
    address: '1406 Cavalier Dr, Huntsville, AL 35816',
    description: 'Sought-after Rime Village home that moved quickly. Three bedrooms, two baths, new deck, and a large flat fenced yard.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1980,
    images: imgs.mid.slice(0, 2),
    status: 'sold', zipCode: '35816',
    location: { type: 'Point', coordinates: [-86.6189, 34.7219] },
    tags: ['Rime Village', 'deck', 'fenced yard'],
    closingDate: daysAgo(28), finalSalePrice: 332500,
    viewCount: rnd(130, 300),
  },
  {
    price: 419000,
    address: '2801 Bob Wallace Ave SW, Huntsville, AL 35805',
    description: 'West Huntsville contemporary with open layout and high-end finishes. Sold above asking in 5 days.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2700,
    images: imgs.luxury.slice(0, 2),
    status: 'sold', zipCode: '35805',
    location: { type: 'Point', coordinates: [-86.6312, 34.7152] },
    tags: ['contemporary', 'West Huntsville', 'open layout'],
    closingDate: daysAgo(14), finalSalePrice: 431000,
    viewCount: rnd(150, 350),
  },
];

async function seed() {
  try {
    await connectDB();

    const agents = await Agent.find({ isActive: true });
    if (agents.length === 0) {
      console.warn('No active agents found — listings will have no createdBy. Run seed:agents first.');
    }

    const enriched = listings.map((l, i) => ({
      ...l,
      createdBy: agents.length ? agents[i % agents.length]._id : undefined,
    }));

    const inserted = await Listing.insertMany(enriched);
    console.log(`\nInserted ${inserted.length} Alabama/Huntsville listings.`);
    console.log(`Coordinates pre-set — no geocoding needed.`);

    const statusCounts = inserted.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});
    console.log('Status breakdown:', statusCounts);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Done.');
  }
}

seed();
