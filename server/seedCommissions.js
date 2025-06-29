import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Commission from './models/commissionModel.js';
import User from './models/userModel.js';
import Property from './models/propertyModel.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedCommissions = async () => {
  try {
    // Get some landlords and properties
    const landlords = await User.find({ role: 'landlord' }).limit(5);
    const properties = await Property.find().limit(10);

    if (landlords.length === 0 || properties.length === 0) {
      console.log('No landlords or properties found. Please seed users and properties first.');
      return;
    }

    // Clear existing commissions
    await Commission.deleteMany({});
    console.log('Cleared existing commissions');

    const commissionTypes = ['commission', 'listing_fee', 'service_fee', 'processing_fee', 'monthly_fee'];
    const statuses = ['pending', 'paid', 'overdue'];
    const sampleCommissions = [];

    // Create sample commissions
    for (let i = 0; i < 20; i++) {
      const landlord = landlords[Math.floor(Math.random() * landlords.length)];
      const property = properties[Math.floor(Math.random() * properties.length)];
      const type = commissionTypes[Math.floor(Math.random() * commissionTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Generate random amount based on type
      let amount;
      switch (type) {
        case 'commission':
          amount = Math.floor(Math.random() * 1000) + 200; // $200-$1200
          break;
        case 'listing_fee':
          amount = Math.floor(Math.random() * 200) + 50; // $50-$250
          break;
        case 'service_fee':
          amount = Math.floor(Math.random() * 150) + 25; // $25-$175
          break;
        case 'processing_fee':
          amount = Math.floor(Math.random() * 100) + 10; // $10-$110
          break;
        case 'monthly_fee':
          amount = Math.floor(Math.random() * 151) + 50; // $50-$200
          break;
        default:
          amount = 100;
      }

      // Generate due date (some past, some future)
      const dueDate = new Date();
      if (Math.random() > 0.5) {
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 1); // Future
      } else {
        dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 30) + 1); // Past
      }

      const commission = {
        landlord: landlord._id,
        property: property._id,
        type,
        amount,
        description: `${type.replace('_', ' ')} for ${property.title}`,
        status,
        dueDate,
        paymentMethod: 'stripe',
        isRecurring: Math.random() > 0.7, // 30% chance of being recurring
        recurringInterval: ['monthly', 'quarterly', 'yearly'][Math.floor(Math.random() * 3)],
        notes: Math.random() > 0.5 ? `Sample ${type} note` : '',
        totalAmount: amount
      };

      // Add paid date if status is paid
      if (status === 'paid') {
        commission.paidDate = new Date(dueDate.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000);
      }

      // Add late fees if overdue
      if (status === 'overdue') {
        commission.lateFees = Math.floor(amount * 0.1); // 10% late fee
        commission.totalAmount = amount + commission.lateFees;
      }

      sampleCommissions.push(commission);
    }

    // Insert all commissions
    await Commission.insertMany(sampleCommissions);
    console.log(`Created ${sampleCommissions.length} sample commissions`);

    // Log some statistics
    const stats = await Commission.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0]
            }
          },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0]
            }
          },
          overdueAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'overdue'] }, '$totalAmount', 0]
            }
          }
        }
      }
    ]);

    if (stats.length > 0) {
      console.log('Commission Statistics:');
      console.log(`Total Amount: $${stats[0].totalAmount.toFixed(2)}`);
      console.log(`Pending Amount: $${stats[0].pendingAmount.toFixed(2)}`);
      console.log(`Paid Amount: $${stats[0].paidAmount.toFixed(2)}`);
      console.log(`Overdue Amount: $${stats[0].overdueAmount.toFixed(2)}`);
    }

    console.log('Commission seeding completed successfully');
  } catch (error) {
    console.error('Error seeding commissions:', error);
  }
};

const runSeed = async () => {
  await connectDB();
  await seedCommissions();
  mongoose.connection.close();
  console.log('Database connection closed');
};

runSeed(); 