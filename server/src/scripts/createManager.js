import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import Agent from '../models/Agent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

await mongoose.connect(process.env.MONGO_URI);

const email = 'margaret.holloway@novarealty.com';
const existing = await Agent.findOne({ email });

if (existing) {
  existing.role = 'manager';
  existing.isActive = true;
  await existing.save();
  console.log(`Updated existing user ${email} to role=manager`);
} else {
  await Agent.create({
    name: 'Margaret Holloway',
    email,
    password: 'password123',
    phone: '2054781923',
    licenseNumber: 'AL-RE-204817',
    role: 'manager',
    isActive: true,
    availabilitySlots: [],
  });
  console.log(`Created manager: ${email} / password123`);
}

await mongoose.disconnect();
console.log('Done.');
