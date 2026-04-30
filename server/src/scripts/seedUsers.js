import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import Agent from '../models/Agent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

const users = [
  {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    password: 'password123',
    phone: '2055550101',
    role: 'buyer',
    isActive: true,
  },
  {
    name: 'Derek Fountain',
    email: 'derek.fountain@novarealty.com',
    password: 'password123',
    phone: '2055550102',
    licenseNumber: 'AL-RE-100042',
    role: 'agent',
    isActive: true,
  },
  {
    name: 'Margaret Holloway',
    email: 'margaret.holloway@novarealty.com',
    password: 'password123',
    phone: '2054781923',
    licenseNumber: 'AL-RE-204817',
    role: 'manager',
    isActive: true,
  },
];

await mongoose.connect(process.env.MONGO_URI);

for (const userData of users) {
  const existing = await Agent.findOne({ email: userData.email });
  if (existing) {
    existing.role = userData.role;
    existing.name = userData.name;
    existing.isActive = true;
    await existing.save();
    console.log(`Updated: ${userData.email} (role=${userData.role})`);
  } else {
    await Agent.create(userData);
    console.log(`Created: ${userData.email} (role=${userData.role})`);
  }
}

await mongoose.disconnect();
console.log('Done.');
