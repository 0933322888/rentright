import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Property from './models/propertyModel.js';
import TenantDocument from './models/tenantDocumentModel.js';
import Application from './models/applicationModel.js';
import Ticket from './models/ticketModel.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Use the environment variable
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined. Please check your .env file.');
  process.exit(1);
}

const sampleLandlords = [
  {
    name: 'John Smith',
    email: 'john@example.com',
    password: '123',
    role: 'landlord',
    isVerified: true,
    phone: '555-0101'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    password: '123',
    role: 'landlord',
    isVerified: true,
    phone: '555-0102'
  },
  {
    name: 'Michael Brown',
    email: 'l@l',
    password: '123',
    role: 'landlord',
    isVerified: false,
    phone: '555-0103'
  }
];

const sampleTenants = [
  {
    name: 'Emily Davis',
    email: 'emily@example.com',
    password: '123',
    role: 'tenant',
    hasProfile: true,
    phone: '555-0201'
  },
  {
    name: 'David Wilson',
    email: 'david@example.com',
    password: '123',
    role: 'tenant',
    hasProfile: true,
    phone: '555-0202'
  },
  {
    name: 'Lisa Anderson Tenant',
    email: 't@t',
    password: '123',
    role: 'tenant',
    hasProfile: false,
    phone: '555-0203'
  },
  {
    name: 'Lisa Anderson Admin',
    email: 'a@a',
    password: '123',
    role: 'admin',
    hasProfile: true,
    phone: '111-0203'
  }
];

const sampleProperties = [
  {
    title: 'Modern Downtown Apartment',
    description: 'Beautiful modern apartment in the heart of downtown',
    type: 'apartment',
    price: 2500,
    features: {
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 1500,
      parking: true,
      furnished: true,
      petsAllowed: true
    },
    location: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    amenities: ['Parking', 'Gym', 'Pool'],
    images: ['https://media.istockphoto.com/id/1255835530/photo/modern-custom-suburban-home-exterior.jpg?s=1024x1024&w=is&k=20&c=4TmxYMrPLVb8u09dT5amw1vBsAVbHCxMWZIXqoy-I34=', 'https://media.istockphoto.com/id/520774645/photo/house-exterior-with-curb-appeal.jpg?s=1024x1024&w=is&k=20&c=4rwljqZ3Sd5f2aI3e7um6fKpILko-OrrFiEQCJA38ug=', 'https://media.istockphoto.com/id/590074124/photo/classic-american-house-with-siding-trim-and-red-entry-door.jpg?s=1024x1024&w=is&k=20&c=NXIxkzhayUFnOGqI1hhNFW04ufCpYO_F6KNgNiCHNMo='],
    status: 'active'
  },
  {
    title: 'Cozy Suburban House',
    description: 'Charming house in a quiet neighborhood',
    type: 'house',
    price: 1800,
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1500,
      parking: true,
      furnished: true,
      petsAllowed: true
    },
    location: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001'
    },
    amenities: ['Backyard', 'Garage', 'Fireplace'],
    images: ['https://media.istockphoto.com/id/520774645/photo/house-exterior-with-curb-appeal.jpg?s=1024x1024&w=is&k=20&c=4rwljqZ3Sd5f2aI3e7um6fKpILko-OrrFiEQCJA38ug=', 'https://media.istockphoto.com/id/590074124/photo/classic-american-house-with-siding-trim-and-red-entry-door.jpg?s=1024x1024&w=is&k=20&c=NXIxkzhayUFnOGqI1hhNFW04ufCpYO_F6KNgNiCHNMo='],
    status: 'submitted'
  },
  {
    title: 'Luxury Condo with View',
    description: 'Stunning condo with panoramic city views',
    type: 'condo',
    price: 3500,
    features: {
      bedrooms: 2,
      bathrooms: 2.5,
      squareFootage: 1500,
      parking: true,
      furnished: true,
      petsAllowed: true
    },
    location: {
      street: '789 Park Blvd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601'
    },
    amenities: ['Doorman', 'Concierge', 'Rooftop Deck'],
    images: [
      'https://media.istockphoto.com/id/520774645/photo/house-exterior-with-curb-appeal.jpg?s=1024x1024&w=is&k=20&c=4rwljqZ3Sd5f2aI3e7um6fKpILko-OrrFiEQCJA38ug=', 
      'https://media.istockphoto.com/id/590074124/photo/classic-american-house-with-siding-trim-and-red-entry-door.jpg?s=1024x1024&w=is&k=20&c=NXIxkzhayUFnOGqI1hhNFW04ufCpYO_F6KNgNiCHNMo=', 
      'https://media.istockphoto.com/id/1255835530/photo/modern-custom-suburban-home-exterior.jpg?s=1024x1024&w=is&k=20&c=4TmxYMrPLVb8u09dT5amw1vBsAVbHCxMWZIXqoy-I34='],
    status: 'active'
  }
];

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Property.deleteMany({});
    await TenantDocument.deleteMany({});
    await Ticket.deleteMany({});
    await Application.deleteMany({});
    console.log('Cleared existing data');

    // Hash passwords
    const hashedLandlords = await Promise.all(
      sampleLandlords.map(async (landlord) => ({
        ...landlord,
        password: await bcrypt.hash(landlord.password, 10)
      }))
    );

    const hashedTenants = await Promise.all(
      sampleTenants.map(async (tenant) => ({
        ...tenant,
        password: await bcrypt.hash(tenant.password, 10)
      }))
    );

    // Create users
    const createdLandlords = await User.insertMany(hashedLandlords);
    const createdTenants = await User.insertMany(hashedTenants);
    console.log('Created users');

    // Assign landlords to properties
    const propertiesWithLandlords = sampleProperties.map((property, index) => ({
      ...property,
      landlord: createdLandlords[index % createdLandlords.length]._id
    }));

    // Create properties
    await Property.insertMany(propertiesWithLandlords);
    console.log('Created properties');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed(); 