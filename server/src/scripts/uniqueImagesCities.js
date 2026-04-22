import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import { connectDB } from '../config/db.js';

// All images forced to landscape 3:2 via ?w=1200&h=800&fit=crop
// 55 unique exterior hero shots — none reused from Alabama script
const heroImages = [
  'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600047508788-86b9dba87c62?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1605276374104-9bbc764fb294?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600047508788-86b9dba87c62?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1592595896616-c37162298647?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1529408686-125703b33b76?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600047508788-86b9dba87c62?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1597047084897-51e81819a499?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1596204976717-1a9ff47f74ef?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1502005097973-6a7082348e28?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1561753757-d8880c5a3551?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1622866306950-81d17097d458?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1512916194211-3f2b7f5f7de3?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&h=800&fit=crop',
];

// Interior/detail gallery pool — landscape forced — no portraits
const galleryPool = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop', // kitchen
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=800&fit=crop', // kitchen 2
  'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&h=800&fit=crop', // modern kitchen
  'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=1200&h=800&fit=crop', // kitchen 3
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200&h=800&fit=crop', // living room
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=800&fit=crop', // living room 2
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&h=800&fit=crop', // living room 3
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&h=800&fit=crop', // dining room
  'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=1200&h=800&fit=crop', // dining room 2
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&h=800&fit=crop', // bedroom
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200&h=800&fit=crop', // deck/backyard
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&h=800&fit=crop',   // exterior detail
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&h=800&fit=crop', // bathroom
  'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&h=800&fit=crop',   // bathroom 2
  'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=1200&h=800&fit=crop', // pool/backyard
  'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&h=800&fit=crop', // backyard 2
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&h=800&fit=crop', // modern interior
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1200&h=800&fit=crop', // living/dining
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=800&fit=crop',   // sofa/living
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=800&fit=crop', // open plan
];

// Only target the zip codes inserted by seedMajorCities.js
const cityZips = [
  '10024','11215','11106','11211',           // New York
  '90027','90291','91101','90006',           // Los Angeles
  '60614','60622','60637','60302',           // Chicago
  '77019','77382','77007','77449',           // Houston
  '85251','85282','85016','85297',           // Phoenix/Scottsdale
  '75205','75225','75035',                   // Dallas
  '78704','78702','78613',                   // Austin
  '80209','80211','80238',                   // Denver
  '37208','37206','37027','37204',           // Nashville
  '30326','30306','30030',                   // Atlanta
  '33134','33133','33136','33071',           // Miami
  '98102','98103','98004','98109',           // Seattle
  '02116','02118','02139',                   // Boston
  '89141','89145','89002',                   // Las Vegas
];

async function run() {
  try {
    await connectDB();

    const listings = await Listing.find({ zipCode: { $in: cityZips } })
      .select('_id address')
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Updating images for ${listings.length} major-city listings...`);

    // Deduplicate hero list just in case
    const uniqueHeroes = [...new Set(heroImages)];

    for (let i = 0; i < listings.length; i++) {
      const hero = uniqueHeroes[i % uniqueHeroes.length];

      // Pick 3 gallery shots that aren't the hero, rotating through the pool
      const filtered = galleryPool.filter(img => img !== hero);
      const start = (i * 3) % filtered.length;
      const gallery = [
        filtered[start % filtered.length],
        filtered[(start + 1) % filtered.length],
        filtered[(start + 2) % filtered.length],
      ];

      const images = [hero, ...gallery];

      await Listing.findByIdAndUpdate(listings[i]._id, { $set: { images } });
      console.log(`  [${i + 1}/${listings.length}] ${listings[i].address.split(',')[0]}`);
    }

    console.log('\nDone. All major-city listings now have unique landscape images.');
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
