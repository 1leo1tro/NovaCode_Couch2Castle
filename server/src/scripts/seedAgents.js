import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Agent from '../models/Agent.js';

dotenv.config();

// Generate YYYY-MM-DD strings for the next N weekdays starting from today
const upcomingDates = (count = 5) => {
  const dates = [];
  const d = new Date();
  while (dates.length < count) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      dates.push(d.toISOString().slice(0, 10));
    }
  }
  return dates;
};

const [mon, tue, wed, thu, fri] = upcomingDates(5);

// 15 agents across multiple real-estate markets
const agentData = [
  {
    name: 'Margaret Holloway',
    email: 'margaret.holloway@novarealty.com',
    password: 'password123',
    phone: '2054781923',
    licenseNumber: 'AL-RE-204817',
    role: 'manager',
    isActive: true,
    availabilitySlots: [
      { date: mon, startTime: '09:00', endTime: '17:00' },
      { date: tue, startTime: '09:00', endTime: '17:00' },
      { date: wed, startTime: '09:00', endTime: '17:00' },
      { date: thu, startTime: '09:00', endTime: '17:00' },
      { date: fri, startTime: '09:00', endTime: '15:00' },
    ]
  },
  {
    name: 'Derek Fountain',
    email: 'derek.fountain@novarealty.com',
    password: 'password123',
    phone: '2568349201',
    licenseNumber: 'AL-RE-319042',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: mon, startTime: '10:00', endTime: '18:00' },
      { date: wed, startTime: '10:00', endTime: '18:00' },
      { date: fri, startTime: '10:00', endTime: '16:00' },
    ]
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@novarealty.com',
    password: 'password123',
    phone: '6154829307',
    licenseNumber: 'TN-RE-571338',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: mon, startTime: '08:30', endTime: '16:30' },
      { date: tue, startTime: '08:30', endTime: '16:30' },
      { date: thu, startTime: '08:30', endTime: '16:30' },
    ]
  },
  {
    name: 'Carlos Mendez',
    email: 'carlos.mendez@novarealty.com',
    password: 'password123',
    phone: '4048571620',
    licenseNumber: 'GA-RE-682940',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: tue, startTime: '09:00', endTime: '17:00' },
      { date: wed, startTime: '09:00', endTime: '17:00' },
      { date: thu, startTime: '09:00', endTime: '17:00' },
      { date: fri, startTime: '09:00', endTime: '17:00' },
    ]
  },
  {
    name: 'Tanya Okoye',
    email: 'tanya.okoye@novarealty.com',
    password: 'password123',
    phone: '9012384756',
    licenseNumber: 'TN-RE-447261',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: mon, startTime: '11:00', endTime: '19:00' },
      { date: tue, startTime: '11:00', endTime: '19:00' },
      { date: wed, startTime: '11:00', endTime: '19:00' },
      { date: fri, startTime: '10:00', endTime: '16:00' },
    ]
  },
  {
    name: 'James Whitfield',
    email: 'james.whitfield@novarealty.com',
    password: 'password123',
    phone: '2054930187',
    licenseNumber: 'AL-RE-093156',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: mon, startTime: '09:00', endTime: '17:00' },
      { date: tue, startTime: '09:00', endTime: '17:00' },
      { date: wed, startTime: '09:00', endTime: '17:00' },
      { date: thu, startTime: '09:00', endTime: '17:00' },
    ]
  },
  {
    name: 'Linda Chu',
    email: 'linda.chu@novarealty.com',
    password: 'password123',
    phone: '6153027841',
    licenseNumber: 'TN-RE-228403',
    role: 'agent',
    isActive: false,
    availabilitySlots: []
  },
  {
    name: 'Rafael Torres',
    email: 'rafael.torres@novarealty.com',
    password: 'password123',
    phone: '3052948173',
    licenseNumber: 'FL-RE-104729',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: mon, startTime: '09:00', endTime: '17:00' },
      { date: tue, startTime: '09:00', endTime: '17:00' },
      { date: wed, startTime: '09:00', endTime: '17:00' },
      { date: fri, startTime: '10:00', endTime: '15:00' },
    ]
  },
  {
    name: 'Simone Hartley',
    email: 'simone.hartley@novarealty.com',
    password: 'password123',
    phone: '7134829056',
    licenseNumber: 'TX-RE-389512',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: mon, startTime: '08:00', endTime: '16:00' },
      { date: wed, startTime: '08:00', endTime: '16:00' },
      { date: thu, startTime: '08:00', endTime: '16:00' },
    ]
  },
  {
    name: 'Kevin Park',
    email: 'kevin.park@novarealty.com',
    password: 'password123',
    phone: '4152038476',
    licenseNumber: 'CA-RE-571094',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: tue, startTime: '10:00', endTime: '18:00' },
      { date: wed, startTime: '10:00', endTime: '18:00' },
      { date: thu, startTime: '10:00', endTime: '18:00' },
      { date: fri, startTime: '10:00', endTime: '18:00' },
    ]
  },
  {
    name: 'Danielle Brooks',
    email: 'danielle.brooks@novarealty.com',
    password: 'password123',
    phone: '7702839145',
    licenseNumber: 'GA-RE-774821',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: mon, startTime: '09:30', endTime: '17:30' },
      { date: tue, startTime: '09:30', endTime: '17:30' },
      { date: thu, startTime: '09:30', endTime: '17:30' },
      { date: fri, startTime: '09:30', endTime: '17:30' },
    ]
  },
  {
    name: 'Marcus Webb',
    email: 'marcus.webb@novarealty.com',
    password: 'password123',
    phone: '9193047582',
    licenseNumber: 'NC-RE-203948',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: mon, startTime: '08:00', endTime: '17:00' },
      { date: tue, startTime: '08:00', endTime: '17:00' },
      { date: wed, startTime: '08:00', endTime: '17:00' },
      { date: thu, startTime: '08:00', endTime: '17:00' },
      { date: fri, startTime: '08:00', endTime: '14:00' },
    ]
  },
  {
    name: 'Vanessa Nguyen',
    email: 'vanessa.nguyen@novarealty.com',
    password: 'password123',
    phone: '5124730918',
    licenseNumber: 'TX-RE-912047',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: tue, startTime: '11:00', endTime: '19:00' },
      { date: wed, startTime: '11:00', endTime: '19:00' },
      { date: fri, startTime: '10:00', endTime: '17:00' },
    ]
  },
  {
    name: 'Aaron Castillo',
    email: 'aaron.castillo@novarealty.com',
    password: 'password123',
    phone: '6024719382',
    licenseNumber: 'AZ-RE-503817',
    role: 'agent',
    isActive: true,
    availabilitySlots: [
      { date: mon, startTime: '09:00', endTime: '17:00' },
      { date: wed, startTime: '09:00', endTime: '17:00' },
      { date: thu, startTime: '09:00', endTime: '17:00' },
      { date: fri, startTime: '09:00', endTime: '15:00' },
    ]
  },
  {
    name: 'Thomas Ewing',
    email: 'thomas.ewing@novarealty.com',
    password: 'password123',
    phone: '3124859203',
    licenseNumber: 'IL-RE-348201',
    role: 'agent',
    isActive: false,
    availabilitySlots: []
  }
];

const seedAgents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Agent.deleteMany({});
    console.log('Cleared existing agents');

    const hashedPassword = await bcrypt.hash('password123', 10);
    const agentDataHashed = agentData.map(a => ({ ...a, password: hashedPassword }));
    const createdAgents = await Agent.insertMany(agentDataHashed);
    console.log(`Created ${createdAgents.length} agents`);

    console.log('\n--- Agent Summary ---');
    console.log('─'.repeat(80));
    createdAgents.forEach((agent, i) => {
      console.log(`${i + 1}. ${agent.name} [${agent.role.toUpperCase()}]${agent.isActive ? '' : ' (INACTIVE)'}`);
      console.log(`   Email: ${agent.email}  |  Password: password123 (testing)`);
      console.log(`   Phone: ${agent.phone}  |  License: ${agent.licenseNumber}`);
      console.log(`   ID: ${agent._id}`);
      console.log('─'.repeat(80));
    });

    console.log('\nAgent seeding completed successfully!');
    console.log('\nTest login: margaret.holloway@novarealty.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding agents:', error);
    process.exit(1);
  }
};

seedAgents();
