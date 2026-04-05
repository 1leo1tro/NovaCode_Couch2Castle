import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Agent from '../models/Agent.js';

dotenv.config();

const seedAgents = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing agents
    await Agent.deleteMany({});
    console.log('🗑️  Cleared existing agents');

    // Sample agent data
    const agents = [
      {
        name: 'John Smith',
        email: 'john@example.com',
        password: 'password123', // Will be hashed automatically
        phone: '2051234567',
        licenseNumber: 'AL-RE-12345',
        role: 'manager',
        isActive: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: 'password123',
        phone: '2059876543',
        licenseNumber: 'AL-RE-67890',
        isActive: true
      },
      {
        name: 'Mike Davis',
        email: 'mike@example.com',
        password: 'password123',
        phone: '2055551234',
        licenseNumber: 'AL-RE-11111',
        isActive: true
      },
      {
        name: 'Emily Brown (Inactive)',
        email: 'emily@example.com',
        password: 'password123',
        phone: '2055559999',
        licenseNumber: 'AL-RE-99999',
        isActive: false // This agent is deactivated
      }
    ];

    // Create agents
    const createdAgents = await Agent.create(agents);
    console.log(`✅ Created ${createdAgents.length} agents`);

    // Display created agents (without passwords)
    console.log('\n📋 Sample Agents:');
    console.log('─'.repeat(80));
    createdAgents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name}`);
      console.log(`   Email: ${agent.email}`);
      console.log(`   Password: password123 (for testing)`);
      console.log(`   Phone: ${agent.phone}`);
      console.log(`   License: ${agent.licenseNumber}`);
      console.log(`   Active: ${agent.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`   ID: ${agent._id}`);
      console.log('─'.repeat(80));
    });

    console.log('\n🎉 Agent seeding completed successfully!');
    console.log('\n💡 Test Login:');
    console.log('   Email: john@example.com');
    console.log('   Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding agents:', error);
    process.exit(1);
  }
};

seedAgents();
