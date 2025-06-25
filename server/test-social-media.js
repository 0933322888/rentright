import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'tenant',
  phone: '123-456-7890',
  socialMedia: {
    facebook: 'https://facebook.com/testuser',
    linkedin: 'https://linkedin.com/in/testuser',
    instagram: 'https://instagram.com/testuser',
    x: 'https://x.com/testuser',
    website: 'https://testuser.com'
  }
};

async function testSocialMedia() {
  try {
    console.log('🧪 Testing Social Media Functionality...\n');

    // 1. Register a new user with social media
    console.log('1. Registering user with social media...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
    console.log('✅ User registered successfully');
    console.log('User data:', registerResponse.data);

    // 2. Login to get token
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
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
      facebook: 'https://facebook.com/updateduser',
      linkedin: 'https://linkedin.com/in/updateduser',
      instagram: 'https://instagram.com/updateduser',
      x: 'https://x.com/updateduser',
      website: 'https://updateduser.com'
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

    // 5. Test validation with invalid URLs
    console.log('\n5. Testing validation with invalid URLs...');
    const invalidSocialMedia = {
      facebook: 'invalid-url',
      linkedin: 'not-a-linkedin-url',
      instagram: 'https://instagram.com/valid',
      x: 'https://x.com/valid',
      website: 'https://valid.com'
    };

    const invalidFormData = new FormData();
    invalidFormData.append('socialMedia', JSON.stringify(invalidSocialMedia));

    try {
      await axios.patch(`${API_BASE}/users/profile`, invalidFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('❌ Expected validation error but update succeeded');
    } catch (error) {
      console.log('✅ Validation error caught as expected:', error.response?.data?.message);
    }

    console.log('\n🎉 Social Media Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSocialMedia(); 