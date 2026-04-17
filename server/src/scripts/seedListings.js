import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';
import { connectDB } from '../config/db.js';

/**
 * Seed data covering realistic US real-estate markets:
 * - Cities: Huntsville AL, Nashville TN, Atlanta GA, Austin TX, Denver CO
 * - Price ranges reflect regional market conditions
 * - Mix of active (22), pending (8), sold (10), inactive (5) = 45 total
 * - Sold listings include closingDate and finalSalePrice
 * - Descriptions, tags, and realistic image arrays
 * - daysOnMarket auto-calculated from createdAt/closingDate via pre-save hook
 */

// Helper: random int in [min, max]
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: date N days ago
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// Placeholder image sets by price tier (3 tiers: budget, mid, luxury)
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

const listings = [
  // ─── HUNTSVILLE, AL (budget–mid market) ───────────────────────────────────
  {
    price: 189000,
    address: '412 Weatherly Rd, Huntsville, AL 35803',
    description: 'Charming 3-bed ranch-style home in established neighborhood. Newly painted interior, updated kitchen appliances, and a large fenced backyard perfect for entertaining.',
    squareFeet: 1350,
    images: imgs.budget.slice(0, 2),
    status: 'active',
    zipCode: '35803',
    tags: ['ranch', 'fenced yard', 'updated kitchen'],
    viewCount: rnd(20, 80),
  },
  {
    price: 224900,
    address: '78 Walnut Grove Cir, Huntsville, AL 35806',
    description: 'Move-in ready home with open floor plan, vaulted ceilings, and a two-car garage. Quiet cul-de-sac location near research park.',
    squareFeet: 1640,
    images: imgs.budget,
    status: 'active',
    zipCode: '35806',
    tags: ['cul-de-sac', 'garage', 'open floor plan'],
    viewCount: rnd(30, 100),
  },
  {
    price: 267500,
    address: '1903 Hampton Cove Pkwy, Owens Cross Roads, AL 35763',
    description: 'Spacious 4-bedroom home backing up to a greenbelt. Features granite countertops, hardwood floors, and a covered back porch.',
    squareFeet: 2100,
    images: imgs.mid.slice(0, 3),
    status: 'active',
    zipCode: '35763',
    tags: ['greenbelt', 'hardwood floors', 'granite countertops'],
    viewCount: rnd(40, 120),
  },
  {
    price: 315000,
    address: '540 Legends Creek Dr, Huntsville, AL 35824',
    description: 'Newer construction in gated community. Energy-efficient windows, smart thermostat, and a chef\'s kitchen with quartz counters.',
    squareFeet: 2380,
    images: imgs.mid,
    status: 'active',
    zipCode: '35824',
    tags: ['gated', 'new construction', 'smart home', 'energy efficient'],
    viewCount: rnd(50, 150),
  },
  {
    price: 379000,
    address: '204 Blossomwood Dr NW, Huntsville, AL 35801',
    description: 'Mid-century modern gem in the coveted Blossomwood neighborhood. Original hardwood floors, updated bathrooms, and a sunlit screened porch.',
    squareFeet: 2650,
    images: imgs.mid,
    status: 'active',
    zipCode: '35801',
    tags: ['mid-century', 'hardwood floors', 'screened porch', 'historic neighborhood'],
    viewCount: rnd(60, 180),
  },
  {
    price: 445000,
    address: '3317 Meridian St N, Huntsville, AL 35811',
    description: 'Renovated craftsman with original character intact. New roof (2023), updated HVAC, large workshop/garage, and mature shade trees.',
    squareFeet: 2900,
    images: imgs.mid,
    status: 'pending',
    zipCode: '35811',
    tags: ['craftsman', 'renovated', 'workshop', 'new roof'],
    viewCount: rnd(80, 200),
  },
  {
    price: 498500,
    address: '815 Governors Dr SW, Huntsville, AL 35801',
    description: 'Executive home in prestigious Governors neighborhood. Formal dining, home office, primary suite with spa bath, and a resort-style pool.',
    squareFeet: 3400,
    images: imgs.luxury.slice(0, 3),
    status: 'active',
    zipCode: '35801',
    tags: ['pool', 'home office', 'executive', 'spa bath'],
    viewCount: rnd(70, 200),
  },
  {
    price: 112000,
    address: '29 Oakdale Ave SE, Huntsville, AL 35801',
    description: 'Solid starter home near downtown. New roof and windows. Needs cosmetic updates — priced to sell quickly.',
    squareFeet: 980,
    images: imgs.budget.slice(0, 1),
    status: 'sold',
    zipCode: '35801',
    tags: ['starter home', 'fixer upper', 'downtown proximity'],
    closingDate: daysAgo(45),
    finalSalePrice: 108500,
    viewCount: rnd(90, 220),
  },
  {
    price: 285000,
    address: '1102 Bankhead Pkwy NE, Huntsville, AL 35801',
    description: 'Split-level with stunning Monte Sano views. Updated kitchen, new deck, and a finished basement.',
    squareFeet: 2200,
    images: imgs.mid.slice(0, 2),
    status: 'sold',
    zipCode: '35801',
    tags: ['mountain views', 'deck', 'finished basement', 'split level'],
    closingDate: daysAgo(30),
    finalSalePrice: 291000,
    viewCount: rnd(100, 250),
  },
  {
    price: 159000,
    address: '617 Seminole Dr, Huntsville, AL 35816',
    description: 'Well-maintained brick home with new HVAC and water heater. Established neighborhood with large oak trees.',
    squareFeet: 1200,
    images: imgs.budget,
    status: 'inactive',
    zipCode: '35816',
    tags: ['brick', 'established neighborhood', 'new HVAC'],
    viewCount: rnd(10, 50),
  },

  // ─── NASHVILLE, TN (mid–high market) ─────────────────────────────────────
  {
    price: 389000,
    address: '5614 Harding Pike, Nashville, TN 37205',
    description: 'Beautifully renovated bungalow in Belle Meade corridor. New kitchen with waterfall island, refinished hardwoods, and a private backyard oasis.',
    squareFeet: 1780,
    images: imgs.mid,
    status: 'active',
    zipCode: '37205',
    tags: ['bungalow', 'renovated', 'hardwood floors', 'private yard'],
    viewCount: rnd(80, 200),
  },
  {
    price: 525000,
    address: '312 Delmas Ave, Nashville, TN 37203',
    description: 'Modern townhome steps from 12South. Rooftop terrace with city views, two-car garage, and designer finishes throughout.',
    squareFeet: 2050,
    images: imgs.mid,
    status: 'active',
    zipCode: '37203',
    tags: ['townhome', 'rooftop terrace', 'city views', '12South'],
    viewCount: rnd(100, 300),
  },
  {
    price: 679000,
    address: '1847 Natchez Trace, Nashville, TN 37212',
    description: 'Classic Hillsboro Village home on a tree-lined street. Four bedrooms, formal living, chef\'s kitchen, and walkable to shops and dining.',
    squareFeet: 2880,
    images: imgs.luxury.slice(0, 3),
    status: 'active',
    zipCode: '37212',
    tags: ['walkable', 'Hillsboro Village', 'chef kitchen', 'tree-lined'],
    viewCount: rnd(120, 320),
  },
  {
    price: 875000,
    address: '420 Lynwood Blvd, Nashville, TN 37205',
    description: 'Stately colonial in Forest Hills on half an acre. Wine cellar, theater room, three-car garage, and a resort-style saltwater pool.',
    squareFeet: 4200,
    images: imgs.luxury,
    status: 'active',
    zipCode: '37205',
    tags: ['colonial', 'pool', 'theater room', 'wine cellar', 'acreage'],
    viewCount: rnd(90, 250),
  },
  {
    price: 1150000,
    address: '638 Curtiswood Ln, Nashville, TN 37204',
    description: 'Luxury new build in Green Hills. Open concept with 10-ft ceilings, La Cornue range, primary suite with heated floors, and a resort pool.',
    squareFeet: 5100,
    images: imgs.luxury,
    status: 'active',
    zipCode: '37204',
    tags: ['new build', 'luxury', 'Green Hills', 'heated floors', 'pool'],
    viewCount: rnd(130, 350),
  },
  {
    price: 449000,
    address: '2203 Cahal Ave, Nashville, TN 37210',
    description: 'East Nashville charmer with original character and modern upgrades. Exposed brick, open kitchen, and a pergola-covered patio.',
    squareFeet: 1620,
    images: imgs.mid.slice(0, 3),
    status: 'pending',
    zipCode: '37210',
    tags: ['East Nashville', 'exposed brick', 'pergola', 'updated'],
    viewCount: rnd(150, 350),
  },
  {
    price: 598000,
    address: '910 Glendale Ln, Nashville, TN 37204',
    description: 'Move-in ready Green Hills home with new addition. Five bedrooms, screened porch, and a flat fenced yard.',
    squareFeet: 3100,
    images: imgs.luxury.slice(0, 3),
    status: 'pending',
    zipCode: '37204',
    tags: ['Green Hills', 'screened porch', 'fenced yard', 'addition'],
    viewCount: rnd(100, 280),
  },
  {
    price: 365000,
    address: '714 Cabot Dr, Antioch, TN 37013',
    description: 'Spacious suburban home with modern kitchen and sunroom. Three-car garage and large flat lot.',
    squareFeet: 2640,
    images: imgs.mid.slice(0, 2),
    status: 'sold',
    zipCode: '37013',
    tags: ['suburban', 'sunroom', 'garage', 'large lot'],
    closingDate: daysAgo(60),
    finalSalePrice: 358000,
    viewCount: rnd(80, 200),
  },
  {
    price: 780000,
    address: '331 Westview Dr, Brentwood, TN 37027',
    description: 'Brentwood stunner in award-winning school district. Four-car garage, media room, and a gourmet kitchen with Sub-Zero appliances.',
    squareFeet: 4500,
    images: imgs.luxury,
    status: 'sold',
    zipCode: '37027',
    tags: ['Brentwood', 'school district', 'media room', 'gourmet kitchen'],
    closingDate: daysAgo(20),
    finalSalePrice: 795000,
    viewCount: rnd(200, 450),
  },
  {
    price: 229000,
    address: '8804 Sawyer Brown Rd, Nashville, TN 37221',
    description: 'Starter home in Bellevue. New roof, updated bath, and access to community pool. Great investment opportunity.',
    squareFeet: 1100,
    images: imgs.budget.slice(0, 2),
    status: 'inactive',
    zipCode: '37221',
    tags: ['starter home', 'investment', 'community pool', 'Bellevue'],
    viewCount: rnd(20, 60),
  },

  // ─── ATLANTA, GA (mid–high market) ───────────────────────────────────────
  {
    price: 415000,
    address: '1248 N Highland Ave NE, Atlanta, GA 30306',
    description: 'Virginia-Highland craftsman on a quiet walk-score-98 street. Rocking chair front porch, renovated kitchen, and a detached studio.',
    squareFeet: 1850,
    images: imgs.mid,
    status: 'active',
    zipCode: '30306',
    tags: ['craftsman', 'Virginia-Highland', 'walkable', 'studio'],
    viewCount: rnd(120, 300),
  },
  {
    price: 569000,
    address: '654 Ponce De Leon Ave NE, Atlanta, GA 30308',
    description: 'Poncey-Highland Victorian with original pocket doors and period millwork. Updated systems, finished terrace level.',
    squareFeet: 2700,
    images: imgs.mid,
    status: 'active',
    zipCode: '30308',
    tags: ['Victorian', 'historic', 'Poncey-Highland', 'pocket doors'],
    viewCount: rnd(90, 240),
  },
  {
    price: 749000,
    address: '205 Peachtree Hills Ave NE, Atlanta, GA 30305',
    description: 'Buckhead area transitional with open concept main level. Covered loggia, heated pool, and a chef\'s kitchen opening to a keeping room.',
    squareFeet: 3800,
    images: imgs.luxury.slice(0, 4),
    status: 'active',
    zipCode: '30305',
    tags: ['Buckhead', 'pool', 'loggia', 'chef kitchen', 'keeping room'],
    viewCount: rnd(150, 380),
  },
  {
    price: 1250000,
    address: '3710 Tuxedo Rd NW, Atlanta, GA 30305',
    description: 'Grand Tuxedo Park estate on 1.2 acres. Six bedrooms, carriage house, resort-style pool, and award-winning landscaping.',
    squareFeet: 6800,
    images: imgs.luxury,
    status: 'active',
    zipCode: '30305',
    tags: ['estate', 'Tuxedo Park', 'carriage house', 'pool', 'acreage'],
    viewCount: rnd(100, 300),
  },
  {
    price: 329000,
    address: '88 Flat Shoals Ave SE, Atlanta, GA 30316',
    description: 'East Atlanta Village bungalow within walking distance of shops and restaurants. New deck, open kitchen, and a private garden.',
    squareFeet: 1400,
    images: imgs.mid.slice(0, 2),
    status: 'pending',
    zipCode: '30316',
    tags: ['bungalow', 'East Atlanta', 'walkable', 'garden'],
    viewCount: rnd(180, 400),
  },
  {
    price: 485000,
    address: '2117 Monroe Dr NE, Atlanta, GA 30324',
    description: 'Morningside home with an exceptional primary suite addition. Three living areas, sunroom, and a professionally landscaped yard.',
    squareFeet: 2450,
    images: imgs.mid,
    status: 'sold',
    zipCode: '30324',
    tags: ['Morningside', 'sunroom', 'landscaped', 'addition'],
    closingDate: daysAgo(50),
    finalSalePrice: 492000,
    viewCount: rnd(130, 320),
  },
  {
    price: 695000,
    address: '1560 Woodland Ave NE, Atlanta, GA 30306',
    description: 'Druid Hills tudor revival with original stained glass and period details. Fully updated kitchen and baths; stunning private rear lot.',
    squareFeet: 3500,
    images: imgs.luxury.slice(0, 3),
    status: 'sold',
    zipCode: '30306',
    tags: ['tudor', 'Druid Hills', 'stained glass', 'historic', 'updated'],
    closingDate: daysAgo(15),
    finalSalePrice: 710000,
    viewCount: rnd(200, 450),
  },
  {
    price: 185000,
    address: '4320 Redan Rd, Stone Mountain, GA 30083',
    description: 'Solid brick ranch on corner lot. New roof and HVAC. Needs cosmetic TLC — great for investor or first-time buyer.',
    squareFeet: 1100,
    images: imgs.budget.slice(0, 1),
    status: 'inactive',
    zipCode: '30083',
    tags: ['brick ranch', 'investment', 'corner lot', 'fixer upper'],
    viewCount: rnd(15, 55),
  },

  // ─── AUSTIN, TX (mid–high market) ────────────────────────────────────────
  {
    price: 475000,
    address: '1804 Travis Heights Blvd, Austin, TX 78704',
    description: 'Travis Heights craftsman with original character. Three bedrooms, updated baths, and an entertainer\'s backyard with a fire pit and hot tub.',
    squareFeet: 1680,
    images: imgs.mid,
    status: 'active',
    zipCode: '78704',
    tags: ['Travis Heights', 'craftsman', 'fire pit', 'hot tub', 'South Austin'],
    viewCount: rnd(150, 380),
  },
  {
    price: 649000,
    address: '3107 Clawson Rd, Austin, TX 78704',
    description: 'South Congress corridor home with a thoughtful renovation. Chef\'s kitchen, open living, and a rooftop deck with downtown views.',
    squareFeet: 2100,
    images: imgs.luxury.slice(0, 3),
    status: 'active',
    zipCode: '78704',
    tags: ['South Congress', 'rooftop', 'downtown views', 'renovated'],
    viewCount: rnd(180, 420),
  },
  {
    price: 895000,
    address: '4412 Balcones Dr, Austin, TX 78731',
    description: 'Northwest Hills mid-century modern with sweeping Hill Country views. Pool, cabana, and a dramatic main living room with floor-to-ceiling windows.',
    squareFeet: 3200,
    images: imgs.luxury,
    status: 'active',
    zipCode: '78731',
    tags: ['mid-century', 'Hill Country views', 'pool', 'cabana', 'Northwest Hills'],
    viewCount: rnd(130, 350),
  },
  {
    price: 1350000,
    address: '2809 Laguna Vista Dr, Austin, TX 78746',
    description: 'Lake Austin waterfront with private boat dock and stunning sunset views. Five bedrooms, theater, wine room, and infinity pool.',
    squareFeet: 5800,
    images: imgs.luxury,
    status: 'active',
    zipCode: '78746',
    tags: ['waterfront', 'Lake Austin', 'boat dock', 'infinity pool', 'wine room', 'theater'],
    viewCount: rnd(200, 500),
  },
  {
    price: 398000,
    address: '6623 Manchaca Rd, Austin, TX 78745',
    description: 'South Austin gem with an ADU/casita — live in one, rent the other. Both units fully renovated with modern finishes.',
    squareFeet: 1540,
    images: imgs.mid.slice(0, 3),
    status: 'pending',
    zipCode: '78745',
    tags: ['ADU', 'casita', 'investment', 'South Austin', 'renovated'],
    viewCount: rnd(200, 450),
  },
  {
    price: 559000,
    address: '1100 Shoal Creek Blvd, Austin, TX 78701',
    description: 'Downtown-adjacent home on the Shoal Creek greenbelt. Backs to hike and bike trail. Updated throughout with a modern aesthetic.',
    squareFeet: 1950,
    images: imgs.mid,
    status: 'pending',
    zipCode: '78701',
    tags: ['greenbelt', 'trail access', 'downtown proximity', 'modern'],
    viewCount: rnd(180, 400),
  },
  {
    price: 725000,
    address: '3201 Lake Austin Blvd, Austin, TX 78703',
    description: 'Tarrytown stunner blocks from Lake Austin. Original 1940s architecture preserved with a complete modern renovation.',
    squareFeet: 2700,
    images: imgs.luxury.slice(0, 3),
    status: 'sold',
    zipCode: '78703',
    tags: ['Tarrytown', 'historic', 'renovated', 'Lake Austin proximity'],
    closingDate: daysAgo(40),
    finalSalePrice: 740000,
    viewCount: rnd(250, 550),
  },
  {
    price: 1050000,
    address: '4818 Bull Creek Rd, Austin, TX 78731',
    description: 'Expansive family home on nearly an acre with a resort pool and outdoor kitchen. Four-car garage and guest suite over garage.',
    squareFeet: 4600,
    images: imgs.luxury,
    status: 'sold',
    zipCode: '78731',
    tags: ['acreage', 'pool', 'outdoor kitchen', 'guest suite', 'garage'],
    closingDate: daysAgo(10),
    finalSalePrice: 1025000,
    viewCount: rnd(220, 500),
  },

  // ─── DENVER, CO (mid–high market) ────────────────────────────────────────
  {
    price: 565000,
    address: '2340 Gaylord St, Denver, CO 80205',
    description: 'Congress Park Victorian with a wraparound porch and carriage house converted to a home office. Fully restored with modern systems.',
    squareFeet: 2200,
    images: imgs.mid,
    status: 'active',
    zipCode: '80205',
    tags: ['Victorian', 'carriage house', 'home office', 'Congress Park', 'restored'],
    viewCount: rnd(100, 280),
  },
  {
    price: 729000,
    address: '1156 S Race St, Denver, CO 80210',
    description: 'Washington Park bungalow two blocks from the park. Vaulted main level, new chefs kitchen, and a sun-drenched rear deck.',
    squareFeet: 2560,
    images: imgs.luxury.slice(0, 3),
    status: 'active',
    zipCode: '80210',
    tags: ['Washington Park', 'bungalow', 'park proximity', 'deck', 'chef kitchen'],
    viewCount: rnd(130, 360),
  },
  {
    price: 985000,
    address: '835 Oneida St, Denver, CO 80220',
    description: 'Hilltop property on a premier block with mountain views. Four bedrooms, finished basement, and a professional-grade outdoor kitchen.',
    squareFeet: 3700,
    images: imgs.luxury,
    status: 'active',
    zipCode: '80220',
    tags: ['Hilltop', 'mountain views', 'outdoor kitchen', 'finished basement'],
    viewCount: rnd(120, 320),
  },
  {
    price: 1450000,
    address: '485 Williams St, Denver, CO 80218',
    description: 'Cherry Creek North townhome designed by a local architect. Three rooftop terraces, elevator, heated driveway, and a wine cave.',
    squareFeet: 4100,
    images: imgs.luxury,
    status: 'active',
    zipCode: '80218',
    tags: ['Cherry Creek', 'architect designed', 'elevator', 'rooftop', 'wine cave'],
    viewCount: rnd(150, 400),
  },
  {
    price: 425000,
    address: '4721 Tennyson St, Denver, CO 80212',
    description: 'Berkeley neighborhood cottage steps from the Tennyson Street Art District. Updated kitchen, new bath, and a private courtyard.',
    squareFeet: 1320,
    images: imgs.mid.slice(0, 2),
    status: 'pending',
    zipCode: '80212',
    tags: ['Berkeley', 'cottage', 'art district', 'courtyard'],
    viewCount: rnd(170, 400),
  },
  {
    price: 619000,
    address: '3088 Albion St, Denver, CO 80207',
    description: 'Park Hill craftsman blocks from City Park. Three bedrooms, formal dining, finished basement with bar, and an oversized two-car garage.',
    squareFeet: 2380,
    images: imgs.mid,
    status: 'sold',
    zipCode: '80207',
    tags: ['Park Hill', 'craftsman', 'City Park', 'bar', 'garage'],
    closingDate: daysAgo(55),
    finalSalePrice: 631500,
    viewCount: rnd(140, 350),
  },
  {
    price: 879000,
    address: '2650 E 3rd Ave, Denver, CO 80206',
    description: 'Cherry Creek single-family with a rare private driveway. Designer kitchen, primary suite with spa, and a heated outdoor patio.',
    squareFeet: 3300,
    images: imgs.luxury,
    status: 'sold',
    zipCode: '80206',
    tags: ['Cherry Creek', 'spa', 'designer kitchen', 'heated patio'],
    closingDate: daysAgo(25),
    finalSalePrice: 895000,
    viewCount: rnd(200, 480),
  },
  {
    price: 299000,
    address: '6104 W 64th Ave, Arvada, CO 80003',
    description: 'Ranch home in Arvada with updated systems and new paint throughout. Great value in a growing market.',
    squareFeet: 1180,
    images: imgs.budget,
    status: 'inactive',
    zipCode: '80003',
    tags: ['ranch', 'Arvada', 'value', 'updated systems'],
    viewCount: rnd(10, 45),
  },
  {
    price: 348000,
    address: '5501 Zephyr St, Arvada, CO 80002',
    description: 'Solid brick ranch with original hardwood floors, new roof (2024), and a detached workshop. Convenient to light rail.',
    squareFeet: 1450,
    images: imgs.budget.slice(0, 2),
    status: 'active',
    zipCode: '80002',
    tags: ['brick ranch', 'hardwood floors', 'workshop', 'light rail'],
    viewCount: rnd(50, 160),
  },
];

async function seed() {
  try {
    await connectDB();

    // Clear existing listings
    const existingCount = await Listing.countDocuments();
    if (existingCount > 0) {
      console.log(`Clearing ${existingCount} existing listing(s)...`);
      await Listing.deleteMany({});
    }

    // Load agents so we can assign createdBy
    const agents = await Agent.find({ isActive: true });
    if (agents.length === 0) {
      console.warn('No active agents found — listings will have no createdBy. Run seed:agents first for full data.');
    }

    // Distribute listings across agents (round-robin)
    const enriched = listings.map((l, i) => ({
      ...l,
      createdBy: agents.length ? agents[i % agents.length]._id : undefined,
    }));

    const inserted = await Listing.insertMany(enriched);
    console.log(`Successfully seeded ${inserted.length} listings.`);

    // Summary
    const statusCounts = inserted.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});
    const uniqueZips = [...new Set(inserted.map((l) => l.zipCode))];
    const prices = inserted.map((l) => l.price);
    const sqfts = inserted.map((l) => l.squareFeet);
    const sold = inserted.filter((l) => l.status === 'sold');
    const cities = [...new Set(inserted.map((l) => l.address.split(', ').slice(1).join(', ')))];

    console.log('\n--- Seed Summary ---');
    console.log(`Total listings:   ${inserted.length}`);
    console.log(`Statuses:         ${JSON.stringify(statusCounts)}`);
    console.log(`Unique ZIP codes: ${uniqueZips.length}`);
    console.log(`Markets:          ${[...new Set(inserted.map((l) => {
      const parts = l.address.split(', ');
      return parts[parts.length - 2]; // city
    }))].join(', ')}`);
    console.log(`Price range:      $${Math.min(...prices).toLocaleString()} – $${Math.max(...prices).toLocaleString()}`);
    console.log(`SqFt range:       ${Math.min(...sqfts).toLocaleString()} – ${Math.max(...sqfts).toLocaleString()}`);
    console.log(`Sold w/ closing:  ${sold.filter((l) => l.closingDate).length}`);
    if (agents.length) {
      console.log(`Agents assigned:  ${agents.length} (round-robin)`);
    }
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seed();
