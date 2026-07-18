import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/connecthub');
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@echo.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123!', salt);

    const adminUser = new User({
      username: 'SystemAdmin',
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true,
    });

    await adminUser.save();
    console.log('Admin user seeded successfully!');
    console.log('Email: admin@echo.com');
    console.log('Password: Admin@123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
