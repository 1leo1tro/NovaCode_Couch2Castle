import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';
import { connectDB } from '../config/db.js';

// All coordinates are [longitude, latitude] (GeoJSON format)
// Covers 12 major US metro areas with accurate neighborhood coordinates

const imgs = {
  budget: [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
  ],
  mid: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
    'https://images.unsplash.com/photo-1592595896616-c37162298647?w=800',
    'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800',
  ],
  luxury: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
    'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    'https://images.unsplash.com/photo-1622866306950-81d17097d458?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  ],
  urban: [
    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  ],
};

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const listings = [

  // ══════════════════════════════════════════════════════════════
  // NEW YORK, NY
  // ══════════════════════════════════════════════════════════════
  {
    price: 1250000,
    address: '342 W 85th St, New York, NY 10024',
    description: 'Stunning pre-war co-op on the Upper West Side. High ceilings, original moldings, chef\'s kitchen, and southern exposure. Steps from Riverside Park.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1650,
    images: imgs.urban,
    status: 'active', zipCode: '10024',
    location: { type: 'Point', coordinates: [-73.9857, 40.7831] },
    tags: ['pre-war', 'co-op', 'Upper West Side', 'Riverside Park', 'high ceilings'],
    viewCount: rnd(90, 220),
  },
  {
    price: 875000,
    address: '218 8th Ave, Brooklyn, NY 11215',
    description: 'Gorgeous Park Slope brownstone floor-through. Exposed brick, working fireplace, private garden, and two skylights flooding the space with natural light.',
    bedrooms: 2, bathrooms: 1, squareFeet: 1200,
    images: imgs.urban,
    status: 'active', zipCode: '11215',
    location: { type: 'Point', coordinates: [-73.9798, 40.6682] },
    tags: ['brownstone', 'Park Slope', 'garden', 'fireplace', 'exposed brick'],
    viewCount: rnd(100, 260),
  },
  {
    price: 695000,
    address: '34-12 31st Ave, Astoria, NY 11106',
    description: 'Spacious 3-bed condo in vibrant Astoria. Modern finishes, in-unit laundry, private balcony, and a rooftop deck with Manhattan skyline views.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1380,
    images: imgs.mid,
    status: 'active', zipCode: '11106',
    location: { type: 'Point', coordinates: [-73.9301, 40.7721] },
    tags: ['condo', 'Astoria', 'balcony', 'rooftop', 'skyline views'],
    viewCount: rnd(70, 180),
  },
  {
    price: 1850000,
    address: '87 N 7th St, Brooklyn, NY 11211',
    description: 'Spectacular Williamsburg townhouse with original wide-plank floors, a chef\'s kitchen, rooftop terrace, and a finished basement. Rarely available.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2800,
    images: imgs.luxury,
    status: 'active', zipCode: '11211',
    location: { type: 'Point', coordinates: [-73.9496, 40.7181] },
    tags: ['townhouse', 'Williamsburg', 'rooftop terrace', 'chef kitchen'],
    viewCount: rnd(120, 300),
  },

  // ══════════════════════════════════════════════════════════════
  // LOS ANGELES, CA
  // ══════════════════════════════════════════════════════════════
  {
    price: 1450000,
    address: '2805 Griffith Park Blvd, Los Angeles, CA 90027',
    description: 'Architectural masterpiece in Silver Lake with hillside views, an infinity pool, indoor-outdoor living, and a gourmet kitchen with Miele appliances.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2600,
    images: imgs.luxury,
    status: 'active', zipCode: '90027',
    location: { type: 'Point', coordinates: [-118.2703, 34.0975] },
    tags: ['pool', 'Silver Lake', 'hillside views', 'indoor-outdoor', 'modern'],
    viewCount: rnd(130, 320),
  },
  {
    price: 2100000,
    address: '1228 Abbot Kinney Blvd, Venice, CA 90291',
    description: 'Stunning Venice beach home one block from the ocean. Open floor plan, chef\'s kitchen, two-car garage, and a lush entertainer\'s backyard.',
    bedrooms: 4, bathrooms: 3.5, squareFeet: 2900,
    images: imgs.luxury,
    status: 'active', zipCode: '90291',
    location: { type: 'Point', coordinates: [-118.4695, 33.9850] },
    tags: ['Venice Beach', 'ocean close', 'chef kitchen', 'entertainer'],
    viewCount: rnd(150, 380),
  },
  {
    price: 980000,
    address: '445 N Marengo Ave, Pasadena, CA 91101',
    description: 'Classic California Craftsman bungalow in Old Pasadena. Restored original details, updated kitchen and baths, and a blooming rose garden.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1850,
    images: imgs.mid,
    status: 'active', zipCode: '91101',
    location: { type: 'Point', coordinates: [-118.1445, 34.1478] },
    tags: ['craftsman', 'Pasadena', 'rose garden', 'historic', 'restored'],
    viewCount: rnd(80, 200),
  },
  {
    price: 749000,
    address: '3107 W Olympic Blvd, Los Angeles, CA 90006',
    description: 'Completely renovated Koreatown fourplex — live in one unit, rent the others. New roof, plumbing, electrical, and updated kitchens throughout.',
    bedrooms: 2, bathrooms: 1, squareFeet: 1100,
    images: imgs.budget,
    status: 'active', zipCode: '90006',
    location: { type: 'Point', coordinates: [-118.3016, 34.0575] },
    tags: ['investment', 'Koreatown', 'fourplex', 'renovated', 'income property'],
    viewCount: rnd(90, 240),
  },

  // ══════════════════════════════════════════════════════════════
  // CHICAGO, IL
  // ══════════════════════════════════════════════════════════════
  {
    price: 685000,
    address: '2134 N Lincoln Ave, Chicago, IL 60614',
    description: 'Gorgeous Lincoln Park greystone with original woodwork, three fireplaces, chef\'s kitchen, and a private deck overlooking a landscaped yard.',
    bedrooms: 4, bathrooms: 2.5, squareFeet: 2850,
    images: imgs.mid,
    status: 'active', zipCode: '60614',
    location: { type: 'Point', coordinates: [-87.6364, 41.9214] },
    tags: ['greystone', 'Lincoln Park', 'fireplace', 'chef kitchen', 'deck'],
    viewCount: rnd(80, 200),
  },
  {
    price: 465000,
    address: '1812 W North Ave, Chicago, IL 60622',
    description: 'Bright and modern Wicker Park condo with exposed brick, private rooftop deck, heated garage parking, and incredible neighborhood walkability.',
    bedrooms: 2, bathrooms: 2, squareFeet: 1400,
    images: imgs.urban,
    status: 'active', zipCode: '60622',
    location: { type: 'Point', coordinates: [-87.6793, 41.9087] },
    tags: ['Wicker Park', 'rooftop deck', 'exposed brick', 'walkable', 'condo'],
    viewCount: rnd(70, 170),
  },
  {
    price: 325000,
    address: '5526 S Woodlawn Ave, Chicago, IL 60637',
    description: 'Fully renovated Hyde Park two-flat near the University of Chicago. New systems throughout, updated kitchens, hardwood floors, and a large yard.',
    bedrooms: 3, bathrooms: 2, squareFeet: 2100,
    images: imgs.mid,
    status: 'active', zipCode: '60637',
    location: { type: 'Point', coordinates: [-87.5917, 41.7943] },
    tags: ['Hyde Park', 'two-flat', 'renovated', 'university', 'investment'],
    viewCount: rnd(55, 140),
  },
  {
    price: 525000,
    address: '412 Home Ave, Oak Park, IL 60302',
    description: 'Frank Lloyd Wright district Prairie-style home. Preserved historic details, original art glass windows, updated kitchen, and a deep fenced lot.',
    bedrooms: 4, bathrooms: 2, squareFeet: 2600,
    images: imgs.mid,
    status: 'active', zipCode: '60302',
    location: { type: 'Point', coordinates: [-87.7965, 41.8850] },
    tags: ['Prairie style', 'Oak Park', 'historic', 'art glass', 'Frank Lloyd Wright district'],
    viewCount: rnd(90, 230),
  },

  // ══════════════════════════════════════════════════════════════
  // HOUSTON, TX
  // ══════════════════════════════════════════════════════════════
  {
    price: 485000,
    address: '3102 Del Monte Dr, Houston, TX 77019',
    description: 'Elegantly updated River Oaks-area home. Hardwood floors, formal dining, updated gourmet kitchen, wine cellar, and a resort-style pool.',
    bedrooms: 4, bathrooms: 3, squareFeet: 3200,
    images: imgs.luxury,
    status: 'active', zipCode: '77019',
    location: { type: 'Point', coordinates: [-95.4220, 29.7535] },
    tags: ['River Oaks', 'pool', 'wine cellar', 'gourmet kitchen', 'hardwood floors'],
    viewCount: rnd(80, 200),
  },
  {
    price: 298000,
    address: '6814 Whitaker Dr, The Woodlands, TX 77382',
    description: 'Beautifully maintained home in The Woodlands master-planned community. Open floor plan, covered back patio, and access to top-rated schools and trails.',
    bedrooms: 4, bathrooms: 2.5, squareFeet: 2450,
    images: imgs.mid,
    status: 'active', zipCode: '77382',
    location: { type: 'Point', coordinates: [-95.4690, 30.1658] },
    tags: ['The Woodlands', 'master planned', 'trails', 'top schools', 'patio'],
    viewCount: rnd(60, 160),
  },
  {
    price: 235000,
    address: '2208 Birdsall St, Houston, TX 77007',
    description: 'Stylish Heights bungalow on a tree-lined street. Original hardwood floors, quartz countertops, and a private backyard just blocks from White Oak Bayou trail.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1450,
    images: imgs.budget,
    status: 'active', zipCode: '77007',
    location: { type: 'Point', coordinates: [-95.3988, 29.7691] },
    tags: ['The Heights', 'bungalow', 'hardwood floors', 'trail access', 'tree-lined'],
    viewCount: rnd(50, 130),
  },
  {
    price: 389000,
    address: '4218 Mission Bend Dr, Katy, TX 77449',
    description: 'Spacious Katy home with an open concept layout, four bedrooms, a game room, three-car garage, and a large covered patio. Top Katy ISD schools.',
    bedrooms: 4, bathrooms: 3, squareFeet: 3100,
    images: imgs.mid,
    status: 'active', zipCode: '77449',
    location: { type: 'Point', coordinates: [-95.8246, 29.7858] },
    tags: ['Katy', 'game room', 'three-car garage', 'Katy ISD', 'covered patio'],
    viewCount: rnd(55, 140),
  },

  // ══════════════════════════════════════════════════════════════
  // PHOENIX / SCOTTSDALE, AZ
  // ══════════════════════════════════════════════════════════════
  {
    price: 850000,
    address: '7842 E Camelback Rd, Scottsdale, AZ 85251',
    description: 'Desert contemporary in Old Town Scottsdale. Resort-style pool and spa, outdoor kitchen, soaring ceilings, and panoramic McDowell Mountain views.',
    bedrooms: 4, bathrooms: 3.5, squareFeet: 3400,
    images: imgs.luxury,
    status: 'active', zipCode: '85251',
    location: { type: 'Point', coordinates: [-111.9261, 33.4942] },
    tags: ['Scottsdale', 'pool', 'mountain views', 'outdoor kitchen', 'desert contemporary'],
    viewCount: rnd(100, 260),
  },
  {
    price: 415000,
    address: '1203 E Southern Ave, Tempe, AZ 85282',
    description: 'Fully renovated mid-century home in Tempe near Arizona State University. New kitchen, bathrooms, HVAC, and a resort-style pool in the backyard.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1680,
    images: imgs.mid,
    status: 'active', zipCode: '85282',
    location: { type: 'Point', coordinates: [-111.9300, 33.3855] },
    tags: ['mid-century', 'Tempe', 'ASU area', 'pool', 'renovated'],
    viewCount: rnd(65, 160),
  },
  {
    price: 349000,
    address: '2914 E Glenrosa Ave, Phoenix, AZ 85016',
    description: 'Charming bungalow in the Camelback East Village. Open layout, updated kitchen, sparkling pool, and a lush private backyard with citrus trees.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1520,
    images: imgs.budget,
    status: 'active', zipCode: '85016',
    location: { type: 'Point', coordinates: [-112.0281, 33.5035] },
    tags: ['Camelback East', 'pool', 'citrus trees', 'bungalow', 'updated kitchen'],
    viewCount: rnd(55, 140),
  },
  {
    price: 520000,
    address: '4108 S Lindsay Rd, Gilbert, AZ 85297',
    description: 'Like-new Gilbert home in a top-rated school district. Chef\'s kitchen, large bonus room, three-car garage, and a covered patio with built-in BBQ.',
    bedrooms: 5, bathrooms: 3, squareFeet: 3600,
    images: imgs.mid,
    status: 'active', zipCode: '85297',
    location: { type: 'Point', coordinates: [-111.7890, 33.3028] },
    tags: ['Gilbert', 'bonus room', 'three-car garage', 'built-in BBQ', 'top schools'],
    viewCount: rnd(70, 180),
  },

  // ══════════════════════════════════════════════════════════════
  // DALLAS, TX
  // ══════════════════════════════════════════════════════════════
  {
    price: 1250000,
    address: '4406 Rheims Pl, Dallas, TX 75205',
    description: 'Classic Highland Park home on a quiet street. Formal living and dining, updated kitchen with island, primary suite with sitting room, and a pool.',
    bedrooms: 5, bathrooms: 4, squareFeet: 4200,
    images: imgs.luxury,
    status: 'active', zipCode: '75205',
    location: { type: 'Point', coordinates: [-96.8002, 32.8308] },
    tags: ['Highland Park', 'pool', 'formal dining', 'classic', 'primary suite'],
    viewCount: rnd(110, 280),
  },
  {
    price: 549000,
    address: '2812 Marquette St, Dallas, TX 75225',
    description: 'Updated Lakewood-area home with an open floor plan, quartz kitchen, large backyard with outdoor seating, and a two-car garage.',
    bedrooms: 4, bathrooms: 2, squareFeet: 2300,
    images: imgs.mid,
    status: 'active', zipCode: '75225',
    location: { type: 'Point', coordinates: [-96.7625, 32.8590] },
    tags: ['Lakewood', 'open floor plan', 'quartz kitchen', 'backyard'],
    viewCount: rnd(75, 190),
  },
  {
    price: 465000,
    address: '6108 Shady Grove Rd, Frisco, TX 75035',
    description: 'Newer Frisco home in a sought-after community. Chef\'s kitchen, media room, covered outdoor living area, and access to resort-style amenities.',
    bedrooms: 5, bathrooms: 4, squareFeet: 3500,
    images: imgs.mid,
    status: 'active', zipCode: '75035',
    location: { type: 'Point', coordinates: [-96.8236, 33.1507] },
    tags: ['Frisco', 'media room', 'outdoor living', 'resort amenities', 'newer construction'],
    viewCount: rnd(65, 170),
  },

  // ══════════════════════════════════════════════════════════════
  // AUSTIN, TX
  // ══════════════════════════════════════════════════════════════
  {
    price: 875000,
    address: '2105 S Congress Ave, Austin, TX 78704',
    description: 'Sleek modern home in the heart of South Congress. Polished concrete floors, chef\'s kitchen with waterfall island, rooftop deck, and a lap pool.',
    bedrooms: 3, bathrooms: 2.5, squareFeet: 2200,
    images: imgs.luxury,
    status: 'active', zipCode: '78704',
    location: { type: 'Point', coordinates: [-97.7500, 30.2397] },
    tags: ['South Congress', 'modern', 'rooftop deck', 'lap pool', 'walkable'],
    viewCount: rnd(100, 260),
  },
  {
    price: 649000,
    address: '1408 E 6th St, Austin, TX 78702',
    description: 'Restored East Austin bungalow with a detached ADU. Original hardwood floors, updated open kitchen, private backyard, and walkable to bars and restaurants.',
    bedrooms: 2, bathrooms: 2, squareFeet: 1350,
    images: imgs.mid,
    status: 'active', zipCode: '78702',
    location: { type: 'Point', coordinates: [-97.7219, 30.2653] },
    tags: ['East Austin', 'ADU', 'bungalow', 'walkable', 'hardwood floors'],
    viewCount: rnd(90, 230),
  },
  {
    price: 485000,
    address: '3204 Brushy Creek Rd, Cedar Park, TX 78613',
    description: 'Stunning Cedar Park home backing to a greenbelt. Open floor plan, chef\'s kitchen, three-car garage, and a covered patio with outdoor fireplace.',
    bedrooms: 5, bathrooms: 3.5, squareFeet: 3800,
    images: imgs.mid,
    status: 'active', zipCode: '78613',
    location: { type: 'Point', coordinates: [-97.8203, 30.5052] },
    tags: ['Cedar Park', 'greenbelt', 'outdoor fireplace', 'three-car garage', 'open floor plan'],
    viewCount: rnd(70, 170),
  },

  // ══════════════════════════════════════════════════════════════
  // DENVER, CO
  // ══════════════════════════════════════════════════════════════
  {
    price: 895000,
    address: '350 S Marion Pkwy, Denver, CO 80209',
    description: 'Stunning Cherry Creek bungalow rebuilt top to bottom. White oak floors, Sub-Zero refrigerator, steam shower, and a private rooftop deck with mountain views.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2650,
    images: imgs.luxury,
    status: 'active', zipCode: '80209',
    location: { type: 'Point', coordinates: [-104.9675, 39.7057] },
    tags: ['Cherry Creek', 'mountain views', 'rooftop deck', 'rebuilt', 'white oak floors'],
    viewCount: rnd(100, 260),
  },
  {
    price: 720000,
    address: '3514 W 32nd Ave, Denver, CO 80211',
    description: 'Immaculate Highlands Victorian with a wraparound porch. Restored original staircase, updated kitchen, finished basement, and a two-car garage.',
    bedrooms: 4, bathrooms: 2.5, squareFeet: 2900,
    images: imgs.mid,
    status: 'active', zipCode: '80211',
    location: { type: 'Point', coordinates: [-105.0183, 39.7591] },
    tags: ['Highlands', 'Victorian', 'wraparound porch', 'finished basement'],
    viewCount: rnd(80, 210),
  },
  {
    price: 495000,
    address: '9108 E 29th Ave, Denver, CO 80238',
    description: 'Modern Central Park home in Denver\'s most walkable master-planned community. Open layout, rooftop deck, and steps from Aviator Pool and miles of trails.',
    bedrooms: 3, bathrooms: 2.5, squareFeet: 2100,
    images: imgs.mid,
    status: 'active', zipCode: '80238',
    location: { type: 'Point', coordinates: [-104.8802, 39.7628] },
    tags: ['Central Park', 'rooftop deck', 'master planned', 'trails', 'walkable'],
    viewCount: rnd(65, 170),
  },

  // ══════════════════════════════════════════════════════════════
  // NASHVILLE, TN
  // ══════════════════════════════════════════════════════════════
  {
    price: 695000,
    address: '1104 Monroe St, Nashville, TN 37208',
    description: 'Coveted Germantown craftsman steps from some of Nashville\'s best restaurants. Exposed brick, chef\'s kitchen, rooftop deck, and a private fenced yard.',
    bedrooms: 3, bathrooms: 2.5, squareFeet: 2100,
    images: imgs.mid,
    status: 'active', zipCode: '37208',
    location: { type: 'Point', coordinates: [-86.7878, 36.1771] },
    tags: ['Germantown', 'craftsman', 'rooftop deck', 'chef kitchen', 'walkable'],
    viewCount: rnd(90, 240),
  },
  {
    price: 549000,
    address: '808 N 14th St, Nashville, TN 37206',
    description: 'Hip East Nashville bungalow in a prime location. Fully renovated with an open kitchen, primary suite with spa bath, screened porch, and a workshop.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1750,
    images: imgs.mid,
    status: 'active', zipCode: '37206',
    location: { type: 'Point', coordinates: [-86.7520, 36.1731] },
    tags: ['East Nashville', 'bungalow', 'screened porch', 'spa bath', 'renovated'],
    viewCount: rnd(80, 200),
  },
  {
    price: 875000,
    address: '1520 Gray Fox Trl, Brentwood, TN 37027',
    description: 'Custom estate home in prestigious Brentwood. Gourmet kitchen, four-car garage, resort pool with waterfall, and a finished basement with home theater.',
    bedrooms: 5, bathrooms: 4.5, squareFeet: 5200,
    images: imgs.luxury,
    status: 'active', zipCode: '37027',
    location: { type: 'Point', coordinates: [-86.7830, 36.0334] },
    tags: ['Brentwood', 'pool', 'home theater', 'four-car garage', 'custom built'],
    viewCount: rnd(110, 280),
  },
  {
    price: 465000,
    address: '4217 12th Ave S, Nashville, TN 37204',
    description: 'Charming 12South home on one of the neighborhood\'s most sought-after streets. Hardwood floors, updated kitchen, private backyard, and a detached office.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1680,
    images: imgs.budget,
    status: 'active', zipCode: '37204',
    location: { type: 'Point', coordinates: [-86.7876, 36.1210] },
    tags: ['12South', 'hardwood floors', 'detached office', 'walkable'],
    viewCount: rnd(75, 190),
  },

  // ══════════════════════════════════════════════════════════════
  // ATLANTA, GA
  // ══════════════════════════════════════════════════════════════
  {
    price: 925000,
    address: '3612 Peachtree Rd NE, Atlanta, GA 30326',
    description: 'Stunning Buckhead contemporary with a chef\'s kitchen, home theater, wine cellar, and a resort-style saltwater pool. Gated community with 24-hour security.',
    bedrooms: 5, bathrooms: 4, squareFeet: 4800,
    images: imgs.luxury,
    status: 'active', zipCode: '30326',
    location: { type: 'Point', coordinates: [-84.3680, 33.8539] },
    tags: ['Buckhead', 'pool', 'home theater', 'wine cellar', 'gated'],
    viewCount: rnd(100, 260),
  },
  {
    price: 599000,
    address: '842 N Highland Ave NE, Atlanta, GA 30306',
    description: 'Charming Virginia-Highland bungalow walking distance to restaurants and Ponce City Market. Updated kitchen, sunroom, and a lush private backyard.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1900,
    images: imgs.mid,
    status: 'active', zipCode: '30306',
    location: { type: 'Point', coordinates: [-84.3580, 33.7817] },
    tags: ['Virginia-Highland', 'bungalow', 'sunroom', 'walkable', 'Ponce City Market'],
    viewCount: rnd(85, 210),
  },
  {
    price: 425000,
    address: '409 Ponce de Leon Pl, Decatur, GA 30030',
    description: 'Classic Decatur bungalow on a quiet street. Three bedrooms, original hardwood floors, renovated kitchen, screened porch, and a large fenced yard.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1620,
    images: imgs.budget,
    status: 'active', zipCode: '30030',
    location: { type: 'Point', coordinates: [-84.2966, 33.7748] },
    tags: ['Decatur', 'bungalow', 'screened porch', 'fenced yard', 'hardwood floors'],
    viewCount: rnd(65, 160),
  },

  // ══════════════════════════════════════════════════════════════
  // MIAMI, FL
  // ══════════════════════════════════════════════════════════════
  {
    price: 1850000,
    address: '210 Alhambra Cir, Coral Gables, FL 33134',
    description: 'Grand Coral Gables Mediterranean estate. Vaulted ceilings, original pecky cypress beams, chef\'s kitchen, resort pool with fountain, and a guest house.',
    bedrooms: 5, bathrooms: 4.5, squareFeet: 4600,
    images: imgs.luxury,
    status: 'active', zipCode: '33134',
    location: { type: 'Point', coordinates: [-80.2684, 25.7215] },
    tags: ['Coral Gables', 'Mediterranean', 'pool', 'guest house', 'pecky cypress'],
    viewCount: rnd(120, 300),
  },
  {
    price: 1250000,
    address: '3612 Main Hwy, Coconut Grove, FL 33133',
    description: 'Rare Coconut Grove compound with a main house and detached studio. Tropical landscaping, saltwater pool, outdoor kitchen, and bay breezes throughout.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2800,
    images: imgs.luxury,
    status: 'active', zipCode: '33133',
    location: { type: 'Point', coordinates: [-80.2493, 25.7280] },
    tags: ['Coconut Grove', 'compound', 'saltwater pool', 'outdoor kitchen', 'bay breezes'],
    viewCount: rnd(110, 280),
  },
  {
    price: 695000,
    address: '1428 NW 2nd Ave, Miami, FL 33136',
    description: 'Stylish Wynwood condo in a boutique building above the arts district. Private terrace, polished concrete floors, and concierge service. Walk to Art Basel venues.',
    bedrooms: 2, bathrooms: 2, squareFeet: 1200,
    images: imgs.urban,
    status: 'active', zipCode: '33136',
    location: { type: 'Point', coordinates: [-80.1990, 25.7997] },
    tags: ['Wynwood', 'arts district', 'terrace', 'concierge', 'Art Basel'],
    viewCount: rnd(80, 210),
  },
  {
    price: 485000,
    address: '8104 NW 1st Ct, Coral Springs, FL 33071',
    description: 'Spacious Coral Springs home in a top school district. Four bedrooms, updated kitchen, screened pool patio, new roof (2022), and a three-car garage.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2750,
    images: imgs.mid,
    status: 'active', zipCode: '33071',
    location: { type: 'Point', coordinates: [-80.2706, 26.2708] },
    tags: ['Coral Springs', 'pool', 'screened patio', 'new roof', 'top schools'],
    viewCount: rnd(60, 150),
  },

  // ══════════════════════════════════════════════════════════════
  // SEATTLE, WA
  // ══════════════════════════════════════════════════════════════
  {
    price: 1150000,
    address: '614 10th Ave E, Seattle, WA 98102',
    description: 'Timeless Capitol Hill craftsman with panoramic views of downtown and Puget Sound. Chef\'s kitchen, rooftop deck, wine cellar, and a two-car garage.',
    bedrooms: 4, bathrooms: 2.5, squareFeet: 2900,
    images: imgs.luxury,
    status: 'active', zipCode: '98102',
    location: { type: 'Point', coordinates: [-122.3210, 47.6235] },
    tags: ['Capitol Hill', 'Puget Sound views', 'craftsman', 'rooftop deck', 'wine cellar'],
    viewCount: rnd(110, 280),
  },
  {
    price: 895000,
    address: '4014 Fremont Ave N, Seattle, WA 98103',
    description: 'Charming Fremont bungalow two blocks from the canal. Fully updated kitchen, primary suite addition, hardwood floors, and a private sunny backyard.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1850,
    images: imgs.mid,
    status: 'active', zipCode: '98103',
    location: { type: 'Point', coordinates: [-122.3500, 47.6512] },
    tags: ['Fremont', 'bungalow', 'canal', 'hardwood floors', 'sunny backyard'],
    viewCount: rnd(90, 230),
  },
  {
    price: 1350000,
    address: '10218 NE 20th St, Bellevue, WA 98004',
    description: 'Modern Bellevue home with an open floor plan, floor-to-ceiling windows, chef\'s kitchen, three-car garage, and a beautifully landscaped flat backyard.',
    bedrooms: 5, bathrooms: 3.5, squareFeet: 3900,
    images: imgs.luxury,
    status: 'active', zipCode: '98004',
    location: { type: 'Point', coordinates: [-122.2015, 47.6101] },
    tags: ['Bellevue', 'modern', 'open floor plan', 'three-car garage', 'flat backyard'],
    viewCount: rnd(100, 260),
  },
  {
    price: 780000,
    address: '2208 Queen Anne Ave N, Seattle, WA 98109',
    description: 'Impeccable Queen Anne Tudor with original character and modern updates. Stunning city views, updated kitchen, hardwood floors, and a detached garage.',
    bedrooms: 3, bathrooms: 2, squareFeet: 2100,
    images: imgs.mid,
    status: 'active', zipCode: '98109',
    location: { type: 'Point', coordinates: [-122.3568, 47.6373] },
    tags: ['Queen Anne', 'Tudor', 'city views', 'hardwood floors', 'detached garage'],
    viewCount: rnd(80, 200),
  },

  // ══════════════════════════════════════════════════════════════
  // BOSTON, MA
  // ══════════════════════════════════════════════════════════════
  {
    price: 1450000,
    address: '124 Commonwealth Ave, Boston, MA 02116',
    description: 'Magnificent Back Bay brownstone with original carved woodwork, three fireplaces, chef\'s kitchen, and a private roof deck with Charles River views.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2700,
    images: imgs.luxury,
    status: 'active', zipCode: '02116',
    location: { type: 'Point', coordinates: [-71.0853, 42.3514] },
    tags: ['Back Bay', 'brownstone', 'fireplace', 'roof deck', 'Charles River views'],
    viewCount: rnd(120, 300),
  },
  {
    price: 895000,
    address: '38 Stanhope St, Boston, MA 02118',
    description: 'Beautifully renovated South End row house. Exposed brick, chef\'s kitchen, private patio, and a finished basement — steps from Tremont Street dining.',
    bedrooms: 3, bathrooms: 2.5, squareFeet: 2100,
    images: imgs.urban,
    status: 'active', zipCode: '02118',
    location: { type: 'Point', coordinates: [-71.0715, 42.3445] },
    tags: ['South End', 'row house', 'exposed brick', 'patio', 'walkable'],
    viewCount: rnd(95, 240),
  },
  {
    price: 625000,
    address: '42 Elm St, Cambridge, MA 02139',
    description: 'Sunny Cambridge condo near Central Square and MIT. Hardwood floors, updated kitchen, private outdoor space, and deeded parking. Walk to the T.',
    bedrooms: 2, bathrooms: 1, squareFeet: 1050,
    images: imgs.mid,
    status: 'active', zipCode: '02139',
    location: { type: 'Point', coordinates: [-71.1015, 42.3649] },
    tags: ['Cambridge', 'MIT area', 'T access', 'parking', 'hardwood floors'],
    viewCount: rnd(80, 200),
  },

  // ══════════════════════════════════════════════════════════════
  // LAS VEGAS, NV
  // ══════════════════════════════════════════════════════════════
  {
    price: 985000,
    address: '3 Tournament Players Dr, Las Vegas, NV 89141',
    description: 'Stunning Summerlin estate on a premiere golf course lot. Negative-edge pool, gourmet outdoor kitchen, motorized shades, and a climate-controlled wine room.',
    bedrooms: 5, bathrooms: 4.5, squareFeet: 4500,
    images: imgs.luxury,
    status: 'active', zipCode: '89141',
    location: { type: 'Point', coordinates: [-115.3278, 36.0461] },
    tags: ['Summerlin', 'golf course', 'pool', 'wine room', 'outdoor kitchen'],
    viewCount: rnd(100, 260),
  },
  {
    price: 465000,
    address: '8412 Blue Moon Ct, Las Vegas, NV 89145',
    description: 'Move-in ready Summerlin home on a quiet cul-de-sac. Open floor plan, resort pool with waterfall, three-car garage, and solar panels for low utility bills.',
    bedrooms: 4, bathrooms: 3, squareFeet: 2800,
    images: imgs.mid,
    status: 'active', zipCode: '89145',
    location: { type: 'Point', coordinates: [-115.2931, 36.1748] },
    tags: ['Summerlin', 'cul-de-sac', 'pool', 'solar panels', 'three-car garage'],
    viewCount: rnd(70, 180),
  },
  {
    price: 325000,
    address: '6204 Lollypop Ln, Henderson, NV 89002',
    description: 'Beautifully updated Henderson home. Granite countertops, tile throughout, private pool, and no HOA. Close to Lake Las Vegas and top-rated schools.',
    bedrooms: 3, bathrooms: 2, squareFeet: 1750,
    images: imgs.budget,
    status: 'active', zipCode: '89002',
    location: { type: 'Point', coordinates: [-114.9730, 36.0397] },
    tags: ['Henderson', 'pool', 'no HOA', 'granite countertops', 'Lake Las Vegas'],
    viewCount: rnd(55, 140),
  },
];

async function seed() {
  try {
    await connectDB();

    const agents = await Agent.find({ isActive: true });
    if (agents.length === 0) {
      console.warn('No active agents found — listings will have no createdBy.');
    }

    const enriched = listings.map((l, i) => ({
      ...l,
      createdBy: agents.length ? agents[i % agents.length]._id : undefined,
    }));

    const inserted = await Listing.insertMany(enriched);
    console.log(`\nInserted ${inserted.length} major-city listings.`);

    const byCityState = {};
    inserted.forEach(l => {
      const parts = l.address.split(',');
      const key = parts.slice(-2).join(',').trim();
      byCityState[key] = (byCityState[key] || 0) + 1;
    });
    console.log('\nBreakdown by location:');
    Object.entries(byCityState).forEach(([loc, count]) => console.log(`  ${loc}: ${count}`));
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('\nDone.');
  }
}

seed();
