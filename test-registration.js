// Test registration API
const axios = require('axios');

async function testRegistration() {
  try {
    console.log('Testing admin registration API...');
    
    const response = await axios.post('http://localhost:5000/api/admin/auth/signup', {
      username: 'testadmin',
      email: 'testadmin@example.com',
      password: 'testpassword123'
    });
    
    console.log('Registration Response:', response.data);
    console.log('Status:', response.status);
    console.log('Token received:', !!response.data.token);
    
  } catch (error) {
    console.error('Registration Error:', error.response?.data || error.message);
  }
}

testRegistration();
