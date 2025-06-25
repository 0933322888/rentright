import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined. Please check your .env file.');
    process.exit(1);
}

const adminUser = {
    name: 'Lisa Anderson',
    email: 'admin@gmail.com',
    password: '123',
    role: 'admin',
    hasProfile: true,
    phone: '111-0203-8722',
    termsAccepted: true
};

const createAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existing = await User.findOne({ email: adminUser.email });
        if (existing) {
            console.log('Admin user already exists:', existing.email);
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminUser.password, 10);
        const userToCreate = { ...adminUser, password: hashedPassword };

        const created = await User.create(userToCreate);
        console.log('Admin user created:', created.email);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdmin(); 