import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Test data for landlord
const testLandlord = {
  name: 'Test Landlord',
  email: 'landlord@example.com',
  password: 'password123',
  role: 'landlord',
  phone: '123-456-7890',
  socialMedia: {
    facebook: 'https://facebook.com/testlandlord',
    linkedin: 'https://linkedin.com/in/testlandlord',
    instagram: 'https://instagram.com/testlandlord',
    x: 'https://x.com/testlandlord',
    website: 'https://testlandlord.com'
  }
};

async function testLandlordSocialMedia() {
  try {
    console.log('🧪 Testing Landlord Social Media Functionality...\n');

    // 1. Register a new landlord with social media
    console.log('1. Registering landlord with social media...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testLandlord);
    console.log('✅ Landlord registered successfully');
    console.log('Landlord data:', registerResponse.data);

    // 2. Login to get token
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testLandlord.email,
      password: testLandlord.password
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 3. Get profile to verify social media is saved
    console.log('\n3. Getting profile...');
    const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile retrieved successfully');
    console.log('Profile social media:', profileResponse.data.socialMedia);

    // 4. Update social media
    console.log('\n4. Updating social media...');
    const updatedSocialMedia = {
      facebook: 'https://facebook.com/updatedlandlord',
      linkedin: 'https://linkedin.com/in/updatedlandlord',
      instagram: 'https://instagram.com/updatedlandlord',
      x: 'https://x.com/updatedlandlord',
      website: 'https://updatedlandlord.com'
    };

    const formData = new FormData();
    formData.append('socialMedia', JSON.stringify(updatedSocialMedia));

    const updateResponse = await axios.patch(`${API_BASE}/users/profile`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('✅ Social media updated successfully');
    console.log('Updated social media:', updateResponse.data.socialMedia);

    console.log('\n🎉 Landlord Social Media Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLandlordSocialMedia(); 