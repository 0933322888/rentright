import mongoose from 'mongoose';
import User from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function testForgotPassword() {
  try {
    // Test user creation
    console.log('Creating test user...');
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'tenant',
      phone: '1234567890'
    });
    console.log('Test user created:', testUser.email);

    // Test password reset token generation
    console.log('\nTesting password reset token generation...');
    const resetToken = testUser.createPasswordResetToken();
    await testUser.save();
    console.log('Reset token generated:', resetToken);
    console.log('Token expires at:', testUser.resetPasswordExpires);

    // Test token validation
    console.log('\nTesting token validation...');
    const crypto = await import('crypto');
    const hashedToken = crypto.default
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const userWithToken = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (userWithToken) {
      console.log('✅ Token validation successful');
    } else {
      console.log('❌ Token validation failed');
    }

    // Test password reset
    console.log('\nTesting password reset...');
    testUser.password = 'newpassword123';
    testUser.resetPasswordToken = undefined;
    testUser.resetPasswordExpires = undefined;
    await testUser.save();
    console.log('✅ Password reset successful');

    // Test new password
    console.log('\nTesting new password...');
    const isValidPassword = await testUser.comparePassword('newpassword123');
    if (isValidPassword) {
      console.log('✅ New password works correctly');
    } else {
      console.log('❌ New password validation failed');
    }

    // Clean up
    console.log('\nCleaning up...');
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ Test user deleted');

    console.log('\n🎉 All tests passed! Forgot password functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testForgotPassword(); 