import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import { connectDB } from '../config/db.js';

// 22 completely unique hero images (one per Alabama listing)
// Additional gallery images pulled from a separate pool so there's no hero duplication
const heroImages = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', // cozy ranch
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800', // white two-story
  'https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?w=800', // craftsman
  'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800', // modern exterior
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800', // suburban home
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', // blue shutters
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', // red door colonial
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',    // cottage style
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', // modern white
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800', // light brick
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', // luxury pool home
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', // open living
  'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800', // evening exterior
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', // modern farmhouse
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', // beige stucco
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', // contemporary
  'https://images.unsplash.com/photo-1598228723793-72519195e34a?w=800', // traditional brick
  'https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=800', // ranch exterior
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800', // neighborhood home
  'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800', // new construction
  'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=800', // charming exterior
  'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800', // classic colonial
];

// Gallery fillers (interior/detail shots) — only appear as slide 2+ in carousel
const galleryPool = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', // kitchen
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800', // living room
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800', // dining room
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800', // bedroom
  'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', // bathroom
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', // kitchen 2
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', // living room 2
  'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800', // bedroom 2
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800', // backyard/deck
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',   // garage/exterior detail
];

const alabamaZips = ['35749','35756','35757','35758','35759','35763','35801','35802','35803','35805','35806','35810','35811','35816','35824'];

async function run() {
  try {
    await connectDB();

    const listings = await Listing.find({ zipCode: { $in: alabamaZips } })
      .select('_id address')
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Updating images for ${listings.length} Alabama listings...`);

    for (let i = 0; i < listings.length; i++) {
      const hero = heroImages[i % heroImages.length];
      // Pick 2 unique gallery shots that aren't the hero
      const gallery = galleryPool
        .filter(img => img !== hero)
        .slice((i * 2) % galleryPool.length, (i * 2) % galleryPool.length + 2);

      const images = [hero, ...gallery];

      await Listing.findByIdAndUpdate(listings[i]._id, { $set: { images } });
      console.log(`  [${i + 1}/${listings.length}] ${listings[i].address.split(',')[0]} → hero: ...${hero.slice(-30)}`);
    }

    console.log('\nDone. All Alabama listings now have unique hero images.');
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
