import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Property from './models/propertyModel.js';
import TenantProfile from './models/tenantProfileModel.js';
import Application from './models/applicationModel.js';
import Ticket from './models/ticketModel.js';
import Payment from './models/paymentModel.js';
import Escalation from './models/escalationModel.js';
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
  // MONGODB_URI is not defined. Please check your .env file.
  process.exit(1);
}

const sampleLandlords = [
  {
    name: 'John Smith',
    email: 'landlord@landlord',
    password: '123',
    role: 'landlord',
    isVerified: true,
    phone: '555-0101',
    termsAccepted: true
  },
  {
    name: 'Sarah Johnson',
    email: 'landlord1@landlord1',
    password: '123',
    role: 'landlord',
    isVerified: true,
    phone: '555-0102',
    termsAccepted: true
  },
  {
    name: 'Michael Brown',
    email: 'landlord2@landlord2',
    password: '123',
    role: 'landlord',
    isVerified: false,
    phone: '555-0103',
    termsAccepted: true
  }
];

const sampleTenants = [
  {
    name: 'Emily Davis',
    email: 'tenant@tenant',
    password: '123',
    role: 'tenant',
    hasProfile: true,
    phone: '555-0201',
    termsAccepted: true
  },
  {
    name: 'David Wilson',
    email: 'tenant1@tenant1',
    password: '123',
    role: 'tenant',
    hasProfile: true,
    phone: '555-0202',
    termsAccepted: true
  },
  {
    name: 'Lisa Anderson',
    email: 'tenant2@tenant2',
    password: '123',
    role: 'tenant',
    hasProfile: false,
    phone: '555-0203',
    termsAccepted: true
  },
  {
    name: 'Lisa Anderson',
    email: 'admin@admin',
    password: '123',
    role: 'admin',
    hasProfile: true,
    phone: '111-0203',
    termsAccepted: true
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
    images: [
      'https://images.pexels.com/photos/275484/pexels-photo-275484.jpeg',
      'https://images.pexels.com/photos/1446378/pexels-photo-1446378.jpeg',
      'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg',
      'https://images.pexels.com/photos/2082087/pexels-photo-2082087.jpeg'
    ],
    status: 'active'
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
    images: [
      'https://images.pexels.com/photos/7031607/pexels-photo-7031607.jpeg',
      'https://images.pexels.com/photos/2507016/pexels-photo-2507016.jpeg',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
      'https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg',
      'https://images.pexels.com/photos/3209045/pexels-photo-3209045.jpeg'
    ],
    status: 'active'
  },
  {
    title: 'Lake View 2 Bedroom House',
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
    images: [
      'https://images.pexels.com/photos/259685/pexels-photo-259685.jpeg',
      'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg',
      'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg',
      'https://images.pexels.com/photos/2134224/pexels-photo-2134224.jpeg'
    ],
    status: 'active'
  },
  {
    title: '3 Bedroom Lake View House',
    description: "House in a quiet neighborhood",
    type: 'house',
    price: 1900,
    availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    features: {
      bedrooms: 3,
      bathrooms: 2,
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
    images: [
      'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg',
      'https://images.pexels.com/photos/2155202/pexels-photo-2155202.jpeg',
      'https://images.pexels.com/photos/276554/pexels-photo-276554.jpeg',
      'https://images.pexels.com/photos/323781/pexels-photo-323781.jpeg'
    ],
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
      'https://images.pexels.com/photos/7045920/pexels-photo-7045920.jpeg',
      'https://images.pexels.com/photos/8572163/pexels-photo-8572163.jpeg',
      'https://images.pexels.com/photos/7045918/pexels-photo-7045918.jpeg',
      'https://images.pexels.com/photos/12838528/pexels-photo-12838528.jpeg'
    ],
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
    // Connecting to MongoDB...
    await mongoose.connect(MONGODB_URI);
    // Connected to MongoDB

    // Clear existing data
    await User.deleteMany({});
    await Property.deleteMany({});
    await TenantProfile.deleteMany({});
    await Ticket.deleteMany({});
    await Application.deleteMany({});
    await Payment.deleteMany({});
    await Escalation.deleteMany({});
    // Cleared existing data

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
    // Created users

    // Create tenant documents for specific tenants
    const tenantProfileData = {
      employmentStatus: 'employed',
      employerName: 'Tech Solutions Inc.',
      jobTitle: 'Software Engineer',
      monthlyNetIncome: 8000,
      monthlyDebtRepayment: 1500,
      additionalIncomeAmount: 500,
      additionalIncomeSource: 'Freelance consulting',
      currentRentAmount: 2200,
      monthsAheadCanPay: 3,
      maritalStatus: 'single',
      childSupportAmount: 0,
      adultOccupants: 1,
      childOccupants: 0,
      hasPets: false,
      petCount: 0,
      petTypes: [],
      petSizes: [],
      smokingStatus: 'non-smoker',
      creditScore: 750,
      bankruptcyHistory: false,
      evictionHistory: false,
      hasGuarantor: false,
      guarantorName: '',
      guarantorRelationship: '',
      guarantorPhone: '',
      guarantorEmail: '',
      guarantorAddress: '',
      guarantorMonthlyIncome: 0,
      guarantorEmployer: '',
      guarantorJobTitle: '',
      proofOfIdentity: [],
      proofOfIncome: [],
      creditHistory: [],
      rentalHistory: [],
      additionalDocuments: []
    };

    // Create tenant profiles for sampleTenants[0] and sampleTenants[2]
    const tenantProfiles = [
      {
        ...tenantProfileData,
        tenant: createdTenants[0]._id // sampleTenants[0] - Emily Davis
      },
      {
        ...tenantProfileData,
        tenant: createdTenants[2]._id, // sampleTenants[2] - Lisa Anderson
        employmentStatus: 'self-employed',
        employerName: 'Anderson Consulting',
        jobTitle: 'Independent Consultant',
        monthlyNetIncome: 6500,
        hasPets: true,
        petCount: 1,
        petTypes: ['Dog'],
        petSizes: ['medium'],
        creditScore: 720
      }
    ];

    await TenantProfile.insertMany(tenantProfiles);
    // Created tenant profiles

    // Assign landlords to properties
    const propertiesWithLandlords = sampleProperties.map((property, index) => ({
      ...property,
      landlord: createdLandlords[index % createdLandlords.length]._id
    }));

    // Create properties
    const createdProperties = await Property.insertMany(propertiesWithLandlords);
    // Created properties

    // Create an approved application for the first property
    // const approvedApplication = new Application({
    //   tenant: createdTenants[0]._id, // Emily Davis Tenant
    //   property: createdProperties[0]._id, // Modern Downtown Apartment
    //   status: 'approved',
    //   tenantProfile: (await TenantProfile.findOne({ tenant: createdTenants[0]._id }))._id,
    //   viewingDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
    //   viewingTime: '10:00',
    //   notes: 'Approved tenant with good credit history'
    // });
    // await approvedApplication.save();
    // console.log('Created approved application');

    // // Create payments for the approved tenant
    // const paymentsWithReferences = samplePayments.map(payment => ({
    //   ...payment,
    //   tenant: createdTenants[0]._id, // Emily Davis Tenant
    //   property: createdProperties[0]._id // Modern Downtown Apartment
    // }));

    // await Payment.insertMany(paymentsWithReferences);
    // console.log('Created sample payments');

    // Database seeded successfully
    process.exit(0);
  } catch (error) {
    // Error seeding database
    process.exit(1);
  }
};

seed(); 