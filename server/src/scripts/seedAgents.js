import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Agent from '../models/Agent.js';

dotenv.config();

// 7 agents across multiple real-estate markets
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
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },
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
      { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
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
      { dayOfWeek: 1, startTime: '08:30', endTime: '16:30' },
      { dayOfWeek: 2, startTime: '08:30', endTime: '16:30' },
      { dayOfWeek: 4, startTime: '08:30', endTime: '16:30' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '15:00' },
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
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 0, startTime: '11:00', endTime: '15:00' },
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
      { dayOfWeek: 1, startTime: '11:00', endTime: '19:00' },
      { dayOfWeek: 2, startTime: '11:00', endTime: '19:00' },
      { dayOfWeek: 3, startTime: '11:00', endTime: '19:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' },
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
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    ]
  },
  {
    name: 'Linda Chu',
    email: 'linda.chu@novarealty.com',
    password: 'password123',
    phone: '6153027841',
    licenseNumber: 'TN-RE-228403',
    role: 'agent',
    isActive: false, // On leave
    availabilitySlots: []
  }
];

const seedAgents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Agent.deleteMany({});
    console.log('Cleared existing agents');

    const createdAgents = await Agent.create(agentData);
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
