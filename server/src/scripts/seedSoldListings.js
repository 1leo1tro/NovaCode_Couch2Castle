import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';
import { connectDB } from '../config/db.js';

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const heroImages = [
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&h=800&fit=crop',
];

const galleryPool = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&h=800&fit=crop',
];

const imgs = (i) => {
  const hero = heroImages[i % heroImages.length];
  const g = galleryPool.filter(x => x !== hero);
  return [hero, g[i % g.length], g[(i + 1) % g.length], g[(i + 2) % g.length]];
};

const soldListings = [
  // New York
  { price: 1180000, address: '215 W 92nd St, New York, NY 10024', bedrooms: 3, bathrooms: 2, squareFeet: 1580, zipCode: '10024', location: { type: 'Point', coordinates: [-73.9743, 40.7871] }, tags: ['co-op', 'Upper West Side', 'pre-war'], createdAt: daysAgo(180) },
  { price: 880000,  address: '445 4th Ave, Brooklyn, NY 11215',   bedrooms: 2, bathrooms: 2, squareFeet: 1100, zipCode: '11215', location: { type: 'Point', coordinates: [-73.9819, 40.6681] }, tags: ['condo', 'Park Slope', 'Brooklyn'],       createdAt: daysAgo(210) },
  { price: 695000,  address: '31-20 37th Ave, Astoria, NY 11106',  bedrooms: 2, bathrooms: 1, squareFeet: 980,  zipCode: '11106', location: { type: 'Point', coordinates: [-73.9284, 40.7585] }, tags: ['co-op', 'Astoria', 'Queens'],            createdAt: daysAgo(145) },

  // Los Angeles
  { price: 1450000, address: '2748 Griffith Park Blvd, Los Angeles, CA 90027', bedrooms: 4, bathrooms: 3, squareFeet: 2200, zipCode: '90027', location: { type: 'Point', coordinates: [-118.2858, 34.1088] }, tags: ['craftsman', 'Los Feliz', 'pool'],      createdAt: daysAgo(90)  },
  { price: 1125000, address: '617 Brooks Ave, Venice, CA 90291',               bedrooms: 3, bathrooms: 2, squareFeet: 1600, zipCode: '90291', location: { type: 'Point', coordinates: [-118.4695, 33.9969] }, tags: ['beach', 'Venice', 'modern'],           createdAt: daysAgo(130) },
  { price: 2200000, address: '88 N Los Robles Ave, Pasadena, CA 91101',        bedrooms: 5, bathrooms: 4, squareFeet: 3800, zipCode: '91101', location: { type: 'Point', coordinates: [-118.1518, 34.1477] }, tags: ['luxury', 'Pasadena', 'historic'],       createdAt: daysAgo(60)  },

  // Chicago
  { price: 625000,  address: '2134 N Halsted St, Chicago, IL 60614', bedrooms: 3, bathrooms: 2, squareFeet: 1900, zipCode: '60614', location: { type: 'Point', coordinates: [-87.6491, 41.9208] }, tags: ['Lincoln Park', 'townhome', 'Chicago'], createdAt: daysAgo(155) },
  { price: 480000,  address: '1912 W Augusta Blvd, Chicago, IL 60622', bedrooms: 2, bathrooms: 2, squareFeet: 1350, zipCode: '60622', location: { type: 'Point', coordinates: [-87.6771, 41.8986] }, tags: ['Wicker Park', 'condo', 'Chicago'],   createdAt: daysAgo(200) },
  { price: 395000,  address: '6012 S Drexel Ave, Chicago, IL 60637',   bedrooms: 3, bathrooms: 2, squareFeet: 1750, zipCode: '60637', location: { type: 'Point', coordinates: [-87.6044, 41.7834] }, tags: ['Hyde Park', 'bungalow', 'Chicago'],  createdAt: daysAgo(120) },

  // Houston
  { price: 520000,  address: '2912 Bammel Ln, Houston, TX 77019', bedrooms: 4, bathrooms: 3, squareFeet: 2800, zipCode: '77019', location: { type: 'Point', coordinates: [-95.4218, 29.7628] }, tags: ['River Oaks', 'Houston', 'pool'],         createdAt: daysAgo(75)  },
  { price: 385000,  address: '114 E 26th St, Houston, TX 77008',   bedrooms: 3, bathrooms: 2, squareFeet: 1900, zipCode: '77008', location: { type: 'Point', coordinates: [-95.4122, 29.8071] }, tags: ['Heights', 'Houston', 'craftsman'],      createdAt: daysAgo(160) },
  { price: 299000,  address: '7723 Kingsway Dr, Houston, TX 77449', bedrooms: 3, bathrooms: 2, squareFeet: 1600, zipCode: '77449', location: { type: 'Point', coordinates: [-95.6583, 29.8528] }, tags: ['Katy', 'Houston', 'suburb'],           createdAt: daysAgo(230) },

  // Austin
  { price: 875000,  address: '1508 S Congress Ave, Austin, TX 78704', bedrooms: 3, bathrooms: 2, squareFeet: 1750, zipCode: '78704', location: { type: 'Point', coordinates: [-97.7499, 30.2427] }, tags: ['SoCo', 'Austin', 'bungalow'],         createdAt: daysAgo(110) },
  { price: 660000,  address: '2204 E 6th St, Austin, TX 78702',       bedrooms: 2, bathrooms: 2, squareFeet: 1300, zipCode: '78702', location: { type: 'Point', coordinates: [-97.7214, 30.2604] }, tags: ['East Austin', 'modern', 'Austin'],     createdAt: daysAgo(85)  },
  { price: 1100000, address: '3601 Westlake Dr, Austin, TX 78746',    bedrooms: 5, bathrooms: 4, squareFeet: 3600, zipCode: '78613', location: { type: 'Point', coordinates: [-97.8221, 30.3104] }, tags: ['Westlake', 'luxury', 'pool'],          createdAt: daysAgo(50)  },

  // Denver
  { price: 710000,  address: '460 S Humboldt St, Denver, CO 80209',  bedrooms: 4, bathrooms: 3, squareFeet: 2400, zipCode: '80209', location: { type: 'Point', coordinates: [-104.9622, 39.7021] }, tags: ['Washington Park', 'Denver', 'Tudor'], createdAt: daysAgo(100) },
  { price: 545000,  address: '3512 Osage St, Denver, CO 80211',       bedrooms: 3, bathrooms: 2, squareFeet: 1700, zipCode: '80211', location: { type: 'Point', coordinates: [-105.0192, 39.7751] }, tags: ['LoHi', 'Denver', 'bungalow'],         createdAt: daysAgo(175) },
  { price: 480000,  address: '9921 E Mississippi Ave, Denver, CO 80247', bedrooms: 3, bathrooms: 2, squareFeet: 1550, zipCode: '80238', location: { type: 'Point', coordinates: [-104.8752, 39.6914] }, tags: ['Aurora', 'Denver', 'suburb'],      createdAt: daysAgo(220) },

  // Nashville
  { price: 590000,  address: '914 Shelby Ave, Nashville, TN 37206', bedrooms: 3, bathrooms: 2, squareFeet: 1850, zipCode: '37206', location: { type: 'Point', coordinates: [-86.7397, 36.1631] }, tags: ['East Nashville', 'craftsman', 'Nashville'], createdAt: daysAgo(95)  },
  { price: 780000,  address: '412 Waverly Pl, Nashville, TN 37204',  bedrooms: 4, bathrooms: 3, squareFeet: 2600, zipCode: '37204', location: { type: 'Point', coordinates: [-86.7888, 36.1452] }, tags: ['Melrose', 'Nashville', 'new build'],       createdAt: daysAgo(140) },
  { price: 425000,  address: '1822 Drakes Branch Rd, Brentwood, TN 37027', bedrooms: 3, bathrooms: 2, squareFeet: 2000, zipCode: '37027', location: { type: 'Point', coordinates: [-86.7825, 36.0336] }, tags: ['Brentwood', 'suburb', 'Nashville'], createdAt: daysAgo(195) },

  // Atlanta
  { price: 695000,  address: '3120 Peachtree Rd NE, Atlanta, GA 30326', bedrooms: 3, bathrooms: 3, squareFeet: 2100, zipCode: '30326', location: { type: 'Point', coordinates: [-84.3838, 33.8472] }, tags: ['Buckhead', 'Atlanta', 'condo'],         createdAt: daysAgo(80)  },
  { price: 510000,  address: '634 Moreland Ave NE, Atlanta, GA 30306',  bedrooms: 3, bathrooms: 2, squareFeet: 1700, zipCode: '30306', location: { type: 'Point', coordinates: [-84.3539, 33.7656] }, tags: ['Little Five Points', 'Atlanta', 'craftsman'], createdAt: daysAgo(165) },
  { price: 380000,  address: '2108 Scott Blvd, Decatur, GA 30030',      bedrooms: 3, bathrooms: 2, squareFeet: 1500, zipCode: '30030', location: { type: 'Point', coordinates: [-84.2963, 33.7748] }, tags: ['Decatur', 'Atlanta', 'bungalow'],       createdAt: daysAgo(245) },

  // Miami
  { price: 1350000, address: '3480 Main Hwy, Coconut Grove, FL 33133', bedrooms: 4, bathrooms: 4, squareFeet: 3200, zipCode: '33133', location: { type: 'Point', coordinates: [-80.2413, 25.7193] }, tags: ['Coconut Grove', 'Miami', 'pool'],       createdAt: daysAgo(70)  },
  { price: 870000,  address: '717 NW 7th Ave, Miami, FL 33136',         bedrooms: 3, bathrooms: 3, squareFeet: 2100, zipCode: '33136', location: { type: 'Point', coordinates: [-80.2116, 25.7761] }, tags: ['Wynwood', 'Miami', 'modern'],           createdAt: daysAgo(190) },
  { price: 520000,  address: '8200 NW 98th Ave, Doral, FL 33178',       bedrooms: 3, bathrooms: 2, squareFeet: 1800, zipCode: '33071', location: { type: 'Point', coordinates: [-80.3554, 25.8174] }, tags: ['Doral', 'Miami', 'suburb'],             createdAt: daysAgo(135) },

  // Seattle
  { price: 1050000, address: '2318 Boyer Ave E, Seattle, WA 98102',   bedrooms: 4, bathrooms: 3, squareFeet: 2500, zipCode: '98102', location: { type: 'Point', coordinates: [-122.3148, 47.6384] }, tags: ['Eastlake', 'Seattle', 'views'],       createdAt: daysAgo(105) },
  { price: 820000,  address: '429 NW 60th St, Seattle, WA 98107',     bedrooms: 3, bathrooms: 2, squareFeet: 1950, zipCode: '98103', location: { type: 'Point', coordinates: [-122.3668, 47.6692] }, tags: ['Ballard', 'Seattle', 'craftsman'],    createdAt: daysAgo(150) },
  { price: 1680000, address: '3310 96th Ave NE, Bellevue, WA 98004',  bedrooms: 5, bathrooms: 4, squareFeet: 4100, zipCode: '98004', location: { type: 'Point', coordinates: [-122.2043, 47.6163] }, tags: ['Bellevue', 'luxury', 'new build'],   createdAt: daysAgo(55)  },

  // Boston
  { price: 960000,  address: '186 Marlborough St, Boston, MA 02116',   bedrooms: 3, bathrooms: 2, squareFeet: 1700, zipCode: '02116', location: { type: 'Point', coordinates: [-71.0781, 42.3517] }, tags: ['Back Bay', 'Boston', 'brownstone'],  createdAt: daysAgo(115) },
  { price: 720000,  address: '74 Rutland St, Boston, MA 02118',         bedrooms: 3, bathrooms: 2, squareFeet: 1450, zipCode: '02118', location: { type: 'Point', coordinates: [-71.0742, 42.3414] }, tags: ['South End', 'Boston', 'Victorian'],  createdAt: daysAgo(185) },
  { price: 1240000, address: '23 Ellsworth Ave, Cambridge, MA 02139',  bedrooms: 4, bathrooms: 3, squareFeet: 2300, zipCode: '02139', location: { type: 'Point', coordinates: [-71.1120, 42.3703] }, tags: ['Cambridge', 'Boston', 'colonial'],   createdAt: daysAgo(65)  },

  // Las Vegas
  { price: 420000,  address: '8914 Pinnacle Peak Ct, Las Vegas, NV 89141', bedrooms: 3, bathrooms: 2, squareFeet: 1900, zipCode: '89141', location: { type: 'Point', coordinates: [-115.2441, 36.0138] }, tags: ['Henderson', 'Las Vegas', 'pool'],  createdAt: daysAgo(125) },
  { price: 575000,  address: '4412 Desert Marigold Ln, Las Vegas, NV 89145', bedrooms: 4, bathrooms: 3, squareFeet: 2700, zipCode: '89145', location: { type: 'Point', coordinates: [-115.2815, 36.1768] }, tags: ['Summerlin', 'Las Vegas', 'new build'], createdAt: daysAgo(170) },
  { price: 299000,  address: '312 S Stephanie St, Henderson, NV 89002', bedrooms: 2, bathrooms: 2, squareFeet: 1200, zipCode: '89002', location: { type: 'Point', coordinates: [-114.9819, 36.0218] }, tags: ['Henderson', 'Las Vegas', 'condo'],  createdAt: daysAgo(240) },

  // Huntsville, AL
  { price: 345000,  address: '106 Eustis Ave SE, Huntsville, AL 35801', bedrooms: 3, bathrooms: 2, squareFeet: 1750, zipCode: '35801', location: { type: 'Point', coordinates: [-86.5861, 34.7258] }, tags: ['Downtown', 'Huntsville', 'historic'],  createdAt: daysAgo(88)  },
  { price: 415000,  address: '5012 Whitesburg Dr S, Huntsville, AL 35802', bedrooms: 4, bathrooms: 3, squareFeet: 2400, zipCode: '35802', location: { type: 'Point', coordinates: [-86.5621, 34.7031] }, tags: ['South Huntsville', 'pool', 'suburb'], createdAt: daysAgo(142) },
  { price: 289000,  address: '2418 Jordan Ln NW, Huntsville, AL 35816', bedrooms: 3, bathrooms: 2, squareFeet: 1550, zipCode: '35816', location: { type: 'Point', coordinates: [-86.6218, 34.7582] }, tags: ['Northwest Huntsville', 'ranch'],       createdAt: daysAgo(205) },
];

async function run() {
  try {
    await connectDB();
    const agent = await Agent.findOne().lean();
    if (!agent) throw new Error('No agent found — run the main seed first');

    const docs = soldListings.map((l, i) => ({
      ...l,
      status: 'sold',
      description: l.description || `${l.bedrooms}BR/${l.bathrooms}BA in ${l.address.split(',')[1]?.trim() || 'the area'}. Sold ${Math.round((Date.now() - l.createdAt) / 86400000)} days ago. Great neighborhood with easy access to local amenities.`,
      images: imgs(i),
      viewCount: rnd(40, 180),
      createdBy: agent._id,
    }));

    const inserted = await Listing.insertMany(docs);
    console.log(`Inserted ${inserted.length} sold listings.`);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
