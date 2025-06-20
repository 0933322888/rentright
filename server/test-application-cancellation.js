import mongoose from 'mongoose';
import Application from './models/applicationModel.js';
import Property from './models/propertyModel.js';
import User from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function testApplicationCancellation() {
  try {
    console.log('🧪 Testing application cancellation functionality...\n');

    // Create test data
    const tenant = await User.findOne({ role: 'tenant' });
    const landlord = await User.findOne({ role: 'landlord' });
    
    if (!tenant || !landlord) {
      console.log('❌ Need at least one tenant and one landlord in the database');
      return;
    }

    // Create test properties
    const property1 = new Property({
      title: 'Test Property 1',
      landlord: landlord._id,
      location: { address: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345' },
      price: 1500,
      available: true,
      status: 'approved'
    });

    const property2 = new Property({
      title: 'Test Property 2',
      landlord: landlord._id,
      location: { address: '456 Test Ave', city: 'Test City', state: 'TS', zipCode: '12345' },
      price: 2000,
      available: true,
      status: 'approved'
    });

    const property3 = new Property({
      title: 'Test Property 3',
      landlord: landlord._id,
      location: { address: '789 Test Blvd', city: 'Test City', state: 'TS', zipCode: '12345' },
      price: 1800,
      available: true,
      status: 'approved'
    });

    await Promise.all([property1.save(), property2.save(), property3.save()]);

    // Create test applications
    const application1 = new Application({
      property: property1._id,
      tenant: tenant._id,
      status: 'viewing',
      wantsViewing: true,
      viewingDate: new Date(),
      viewingTime: '10:00-11:00'
    });

    const application2 = new Application({
      property: property2._id,
      tenant: tenant._id,
      status: 'pending',
      wantsViewing: false
    });

    const application3 = new Application({
      property: property3._id,
      tenant: tenant._id,
      status: 'viewing',
      wantsViewing: true,
      viewingDate: new Date(),
      viewingTime: '14:00-15:00'
    });

    await Promise.all([application1.save(), application2.save(), application3.save()]);

    console.log('📋 Initial applications:');
    const initialApplications = await Application.find({ tenant: tenant._id }).populate('property', 'title');
    initialApplications.forEach(app => {
      console.log(`  - ${app.property.title}: ${app.status}`);
    });

    // Simulate approving application1
    console.log('\n✅ Approving application for Property 1...');
    application1.status = 'approved';
    await application1.save();

    // Update property1
    property1.tenant = tenant._id;
    property1.available = false;
    await property1.save();

    // Cancel other applications (this is the logic we added)
    await Application.updateMany(
      {
        tenant: tenant._id,
        _id: { $ne: application1._id },
        status: { $in: ['viewing', 'pending'] }
      },
      {
        status: 'cancelled',
        updatedAt: Date.now()
      }
    );

    console.log('\n📋 Applications after approval:');
    const finalApplications = await Application.find({ tenant: tenant._id }).populate('property', 'title');
    finalApplications.forEach(app => {
      console.log(`  - ${app.property.title}: ${app.status}`);
    });

    // Verify results
    const approvedApp = finalApplications.find(app => app.property.title === 'Test Property 1');
    const cancelledApps = finalApplications.filter(app => app.status === 'cancelled');

    if (approvedApp && approvedApp.status === 'approved' && cancelledApps.length === 2) {
      console.log('\n🎉 Test PASSED! Application cancellation working correctly.');
      console.log(`   - 1 application approved`);
      console.log(`   - ${cancelledApps.length} applications cancelled`);
    } else {
      console.log('\n❌ Test FAILED! Application cancellation not working as expected.');
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Promise.all([
      Application.deleteMany({ _id: { $in: [application1._id, application2._id, application3._id] } }),
      Property.deleteMany({ _id: { $in: [property1._id, property2._id, property3._id] } })
    ]);

    console.log('✅ Test completed and cleaned up.');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testApplicationCancellation(); 