import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Property from './models/propertyModel.js';
import TenantDocument from './models/tenantDocumentModel.js';
import Application from './models/applicationModel.js';
import Ticket from './models/ticketModel.js';
import Payment from './models/paymentModel.js';
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
    name: 'John Smith Landlord',
    email: 'l1@l1',
    password: '123',
    role: 'landlord',
    isVerified: true,
    phone: '555-0101'
  },
  {
    name: 'Sarah Johnson Landlord',
    email: 'l2@l2',
    password: '123',
    role: 'landlord',
    isVerified: true,
    phone: '555-0102'
  },
  {
    name: 'Michael Brown Landlord',
    email: 'l@l',
    password: '123',
    role: 'landlord',
    isVerified: false,
    phone: '555-0103'
  }
];

const sampleTenants = [
  {
    name: 'Emily Davis Tenant',
    email: 't2@t2',
    password: '123',
    role: 'tenant',
    hasProfile: true,
    phone: '555-0201'
  },
  {
    name: 'David Wilson Tenant',
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
    availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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
      zipCode: '10001',
      coordinates: [-74.005974, 40.712776] // New York City
    },
    amenities: ['Parking', 'Gym', 'Pool'],
    viewingDates: [
      {
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        timeSlots: [
          { startTime: '10:00', endTime: '10:30', isBooked: false },
          { startTime: '10:30', endTime: '11:00', isBooked: false },
          { startTime: '11:00', endTime: '11:30', isBooked: false },
          { startTime: '11:30', endTime: '12:00', isBooked: false },
          { startTime: '14:00', endTime: '14:30', isBooked: false },
          { startTime: '14:30', endTime: '15:00', isBooked: false },
          { startTime: '15:00', endTime: '15:30', isBooked: false },
          { startTime: '15:30', endTime: '16:00', isBooked: false }
        ]
      },
      {
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        timeSlots: [
          { startTime: '13:00', endTime: '13:30', isBooked: false },
          { startTime: '13:30', endTime: '14:00', isBooked: false },
          { startTime: '14:00', endTime: '14:30', isBooked: false },
          { startTime: '14:30', endTime: '15:00', isBooked: false },
          { startTime: '15:00', endTime: '15:30', isBooked: false },
          { startTime: '15:30', endTime: '16:00', isBooked: false }
        ]
      },
      {
        date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        timeSlots: [
          { startTime: '16:00', endTime: '16:30', isBooked: false },
          { startTime: '16:30', endTime: '17:00', isBooked: false },
          { startTime: '17:00', endTime: '17:30', isBooked: false },
          { startTime: '17:30', endTime: '18:00', isBooked: false }
        ]
      }
    ],
    images: ['https://media.istockphoto.com/id/1255835530/photo/modern-custom-suburban-home-exterior.jpg?s=1024x1024&w=is&k=20&c=4TmxYMrPLVb8u09dT5amw1vBsAVbHCxMWZIXqoy-I34=', 'https://media.istockphoto.com/id/520774645/photo/house-exterior-with-curb-appeal.jpg?s=1024x1024&w=is&k=20&c=4rwljqZ3Sd5f2aI3e7um6fKpILko-OrrFiEQCJA38ug=', 'https://media.istockphoto.com/id/590074124/photo/classic-american-house-with-siding-trim-and-red-entry-door.jpg?s=1024x1024&w=is&k=20&c=NXIxkzhayUFnOGqI1hhNFW04ufCpYO_F6KNgNiCHNMo='],
    status: 'rented'
  },
  {
    title: 'Cozy Suburban House',
    description: 'Charming house in a quiet neighborhood',
    type: 'house',
    price: 1800,
    availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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
      zipCode: '90001',
      coordinates: [-118.243683, 34.052235] // Los Angeles
    },
    amenities: ['Backyard', 'Garage', 'Fireplace'],
    viewingDates: [
      {
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        timeSlots: [
          { startTime: '10:00', endTime: '10:30', isBooked: false },
          { startTime: '10:30', endTime: '11:00', isBooked: false },
          { startTime: '11:00', endTime: '11:30', isBooked: false },
          { startTime: '11:30', endTime: '12:00', isBooked: false }
        ]
      },
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        timeSlots: [
          { startTime: '14:00', endTime: '14:30', isBooked: false },
          { startTime: '14:30', endTime: '15:00', isBooked: false },
          { startTime: '15:00', endTime: '15:30', isBooked: false },
          { startTime: '15:30', endTime: '16:00', isBooked: false }
        ]
      },
      {
        date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
        timeSlots: [
          { startTime: '13:00', endTime: '13:30', isBooked: false },
          { startTime: '13:30', endTime: '14:00', isBooked: false },
          { startTime: '14:00', endTime: '14:30', isBooked: false },
          { startTime: '14:30', endTime: '15:00', isBooked: false }
        ]
      }
    ],
    images: ['https://media.istockphoto.com/id/520774645/photo/house-exterior-with-curb-appeal.jpg?s=1024x1024&w=is&k=20&c=4rwljqZ3Sd5f2aI3e7um6fKpILko-OrrFiEQCJA38ug=', 'https://media.istockphoto.com/id/590074124/photo/classic-american-house-with-siding-trim-and-red-entry-door.jpg?s=1024x1024&w=is&k=20&c=NXIxkzhayUFnOGqI1hhNFW04ufCpYO_F6KNgNiCHNMo='],
    status: 'active'
  },
  {
    title: 'Cozy Suburban House 2',
    description: 'Less charming house in a loud neighborhood',
    type: 'house',
    price: 1500,
    availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    features: {
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 1100,
      parking: false,
      furnished: true,
      petsAllowed: true
    },
    location: {
      street: '406 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      coordinates: [-118.243683, 34.082235] // Los Angeles
    },
    amenities: ['Backyard', 'Garage', 'Fireplace'],
    viewingDates: [
      {
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        timeSlots: [
          { startTime: '09:00', endTime: '09:30', isBooked: false },
          { startTime: '09:30', endTime: '10:00', isBooked: false },
          { startTime: '10:00', endTime: '10:30', isBooked: false },
          { startTime: '10:30', endTime: '11:00', isBooked: false }
        ]
      },
      {
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
        timeSlots: [
          { startTime: '15:00', endTime: '15:30', isBooked: false },
          { startTime: '15:30', endTime: '16:00', isBooked: false },
          { startTime: '16:00', endTime: '16:30', isBooked: false },
          { startTime: '16:30', endTime: '17:00', isBooked: false }
        ]
      },
      {
        date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000), // 11 days from now
        timeSlots: [
          { startTime: '11:00', endTime: '11:30', isBooked: false },
          { startTime: '11:30', endTime: '12:00', isBooked: false },
          { startTime: '12:00', endTime: '12:30', isBooked: false },
          { startTime: '12:30', endTime: '13:00', isBooked: false }
        ]
      }
    ],
    images: ['https://media.istockphoto.com/id/520774645/photo/house-exterior-with-curb-appeal.jpg?s=1024x1024&w=is&k=20&c=4rwljqZ3Sd5f2aI3e7um6fKpILko-OrrFiEQCJA38ug=', 'https://media.istockphoto.com/id/590074124/photo/classic-american-house-with-siding-trim-and-red-entry-door.jpg?s=1024x1024&w=is&k=20&c=NXIxkzhayUFnOGqI1hhNFW04ufCpYO_F6KNgNiCHNMo='],
    status: 'active'
  },
  {
    title: 'Cozy Suburban House 3',
    description: "House in a quiet neighborhood",
    type: 'house',
    price: 1900,
    availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    features: {
      bedrooms: 1,
      bathrooms: 1,
      squareFootage: 800,
      parking: true,
      furnished: true,
      petsAllowed: false
    },
    location: {
      street: '206 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      coordinates: [-118.256683, 34.022235] // Los Angeles
    },
    amenities: ['Backyard', 'Fireplace'],
    viewingDates: [
      {
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        timeSlots: [
          { startTime: '10:00', endTime: '10:30', isBooked: false },
          { startTime: '10:30', endTime: '11:00', isBooked: false },
          { startTime: '11:00', endTime: '11:30', isBooked: false },
          { startTime: '11:30', endTime: '12:00', isBooked: false }
        ]
      },
      {
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        timeSlots: [
          { startTime: '14:00', endTime: '14:30', isBooked: false },
          { startTime: '14:30', endTime: '15:00', isBooked: false },
          { startTime: '15:00', endTime: '15:30', isBooked: false },
          { startTime: '15:30', endTime: '16:00', isBooked: false }
        ]
      },
      {
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        timeSlots: [
          { startTime: '16:00', endTime: '16:30', isBooked: false },
          { startTime: '16:30', endTime: '17:00', isBooked: false },
          { startTime: '17:00', endTime: '17:30', isBooked: false },
          { startTime: '17:30', endTime: '18:00', isBooked: false }
        ]
      }
    ],
    images: ['https://media.istockphoto.com/id/520774645/photo/house-exterior-with-curb-appeal.jpg?s=1024x1024&w=is&k=20&c=4rwljqZ3Sd5f2aI3e7um6fKpILko-OrrFiEQCJA38ug=', 'https://media.istockphoto.com/id/590074124/photo/classic-american-house-with-siding-trim-and-red-entry-door.jpg?s=1024x1024&w=is&k=20&c=NXIxkzhayUFnOGqI1hhNFW04ufCpYO_F6KNgNiCHNMo='],
    status: 'active'
  },
  {
    title: 'Luxury Condo with View',
    description: 'Stunning condo with panoramic city views',
    type: 'condo',
    price: 3500,
    availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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
      zipCode: '60601',
      coordinates: [-87.623177, 41.885003] // Chicago
    },
    amenities: ['Doorman', 'Concierge', 'Rooftop Deck'],
    viewingDates: [
      {
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        timeSlots: [
          { startTime: '10:00', endTime: '10:30', isBooked: false },
          { startTime: '10:30', endTime: '11:00', isBooked: false },
          { startTime: '11:00', endTime: '11:30', isBooked: false },
          { startTime: '11:30', endTime: '12:00', isBooked: false },
          { startTime: '14:00', endTime: '14:30', isBooked: false },
          { startTime: '14:30', endTime: '15:00', isBooked: false },
          { startTime: '15:00', endTime: '15:30', isBooked: false },
          { startTime: '15:30', endTime: '16:00', isBooked: false }
        ]
      },
      {
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        timeSlots: [
          { startTime: '13:00', endTime: '13:30', isBooked: false },
          { startTime: '13:30', endTime: '14:00', isBooked: false },
          { startTime: '14:00', endTime: '14:30', isBooked: false },
          { startTime: '14:30', endTime: '15:00', isBooked: false },
          { startTime: '15:00', endTime: '15:30', isBooked: false },
          { startTime: '15:30', endTime: '16:00', isBooked: false }
        ]
      },
      {
        date: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000), // 13 days from now
        timeSlots: [
          { startTime: '16:00', endTime: '16:30', isBooked: false },
          { startTime: '16:30', endTime: '17:00', isBooked: false },
          { startTime: '17:00', endTime: '17:30', isBooked: false },
          { startTime: '17:30', endTime: '18:00', isBooked: false }
        ]
      }
    ],
    images: [
      'https://media.istockphoto.com/id/520774645/photo/house-exterior-with-curb-appeal.jpg?s=1024x1024&w=is&k=20&c=4rwljqZ3Sd5f2aI3e7um6fKpILko-OrrFiEQCJA38ug=', 
      'https://media.istockphoto.com/id/590074124/photo/classic-american-house-with-siding-trim-and-red-entry-door.jpg?s=1024x1024&w=is&k=20&c=NXIxkzhayUFnOGqI1hhNFW04ufCpYO_F6KNgNiCHNMo=', 
      'https://media.istockphoto.com/id/1255835530/photo/modern-custom-suburban-home-exterior.jpg?s=1024x1024&w=is&k=20&c=4TmxYMrPLVb8u09dT5amw1vBsAVbHCxMWZIXqoy-I34='],
    status: 'active'
  }
];

// Sample payments data
const samplePayments = [
  {
    amount: 2500,
    date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    dueDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    status: 'paid',
    paymentMethod: 'credit_card',
    description: 'Rent for March 2024'
  },
  {
    amount: 2500,
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    status: 'paid',
    paymentMethod: 'bank_transfer',
    description: 'Rent for April 2024'
  },
  {
    amount: 2500,
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    status: 'paid',
    paymentMethod: 'debit_card',
    description: 'Rent for May 2024'
  },
  {
    amount: 2500,
    date: new Date(), // Current date
    dueDate: new Date(),
    status: 'pending',
    paymentMethod: 'credit_card',
    description: 'Rent for June 2024'
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
    await Payment.deleteMany({});
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

    // Create tenant documents for specific tenants
    const tenantDocumentData = {
      proofOfIdentity: [
        {
          path: "/opt/render/project/src/server/uploads/tenant-documents/1749609937102-644975019-secure_payments.jpg",
          filename: "1749609937102-644975019-secure_payments.jpg",
          uploadedAt: "2025-06-11T02:45:39.020Z",
          _id: "6848edd34c55039273589aaf",
          url: "http://localhost:5000/uploads/tenant-documents/1749609937102-644975019-secure_payments.jpg",
          thumbnailUrl: "http://localhost:5000/uploads/tenant-documents/1749609937102-644975019-secure_payments.jpg"
        }
      ],
      proofOfIncome: [
        {
          path: "/opt/render/project/src/server/uploads/tenant-documents/1749609996587-382554318-legal_compliance.jpg",
          filename: "1749609996587-382554318-legal_compliance.jpg",
          uploadedAt: "2025-06-11T02:46:38.090Z",
          _id: "6848ee0eef1c3cbb2741f8d2",
          url: "http://localhost:5000/uploads/tenant-documents/1749609996587-382554318-legal_compliance.jpg",
          thumbnailUrl: "http://localhost:5000/uploads/tenant-documents/1749609996587-382554318-legal_compliance.jpg"
        }
      ],
      creditHistory: [
        {
          path: "/opt/render/project/src/server/uploads/tenant-documents/1749609998094-910255049-hero_property.png",
          filename: "1749609998094-910255049-hero_property.png",
          uploadedAt: "2025-06-11T02:46:38.489Z",
          _id: "6848ee0eef1c3cbb2741f8d3",
          url: "http://localhost:5000/uploads/tenant-documents/1749609998094-910255049-hero_property.png",
          thumbnailUrl: "http://localhost:5000/uploads/tenant-documents/1749609998094-910255049-hero_property.png"
        }
      ],
      rentalHistory: [
        {
          path: "/opt/render/project/src/server/uploads/tenant-documents/1749609998490-834608717-legal_compliance.jpg",
          filename: "1749609998490-834608717-legal_compliance.jpg",
          uploadedAt: "2025-06-11T02:46:39.992Z",
          _id: "6848ee0fef1c3cbb2741f8d4",
          url: "http://localhost:5000/uploads/tenant-documents/1749609998490-834608717-legal_compliance.jpg",
          thumbnailUrl: "http://localhost:5000/uploads/tenant-documents/1749609998490-834608717-legal_compliance.jpg"
        }
      ],
      additionalDocuments: [
        {
          path: "/opt/render/project/src/server/uploads/tenant-documents/1749609999993-340071967-smart_management.jpg",
          filename: "1749609999993-340071967-smart_management.jpg",
          uploadedAt: "2025-06-11T02:46:41.502Z",
          _id: "6848ee11ef1c3cbb2741f8d5",
          url: "http://localhost:5000/uploads/tenant-documents/1749609999993-340071967-smart_management.jpg",
          thumbnailUrl: "http://localhost:5000/uploads/tenant-documents/1749609999993-340071967-smart_management.jpg"
        }
      ],
      isCurrentlyEmployed: "yes",
      employmentType: "full-time",
      monthlyNetIncome: 10000,
      hasAdditionalIncome: "yes",
      additionalIncomeDescription: "dividends",
      monthlyDebtRepayment: 2000,
      paysChildSupport: "no",
      childSupportAmount: 0,
      hasBeenEvicted: "no",
      currentlyPaysRent: "yes",
      currentRentAmount: 2500,
      hasTwoMonthsRentSavings: "yes",
      canShareFinancialDocuments: "yes",
      canPayMoreThanOneMonth: "yes",
      monthsAheadCanPay: 3
    };

    // Create tenant documents for sampleTenants[0] and sampleTenants[2]
    const tenantDocuments = [
      {
        ...tenantDocumentData,
        tenant: createdTenants[0]._id // sampleTenants[0]
      },
      {
        ...tenantDocumentData,
        tenant: createdTenants[2]._id // sampleTenants[2]
      }
    ];

    await TenantDocument.insertMany(tenantDocuments);
    console.log('Created tenant documents');

    // Assign landlords to properties
    const propertiesWithLandlords = sampleProperties.map((property, index) => ({
      ...property,
      landlord: createdLandlords[index % createdLandlords.length]._id
    }));

    // Create properties
    const createdProperties = await Property.insertMany(propertiesWithLandlords);
    console.log('Created properties');

    // Create an approved application for the first property
    const approvedApplication = new Application({
      tenant: createdTenants[0]._id, // Emily Davis Tenant
      property: createdProperties[0]._id, // Modern Downtown Apartment
      status: 'approved',
      tenantDocument: (await TenantDocument.findOne({ tenant: createdTenants[0]._id }))._id,
      viewingDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
      viewingTime: '10:00',
      notes: 'Approved tenant with good credit history'
    });
    await approvedApplication.save();
    console.log('Created approved application');

    // Create payments for the approved tenant
    const paymentsWithReferences = samplePayments.map(payment => ({
      ...payment,
      tenant: createdTenants[0]._id, // Emily Davis Tenant
      property: createdProperties[0]._id // Modern Downtown Apartment
    }));

    await Payment.insertMany(paymentsWithReferences);
    console.log('Created sample payments');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed(); 