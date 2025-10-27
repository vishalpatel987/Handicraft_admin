// Test complete login flow
const axios = require('axios');

async function testLoginFlow() {
  try {
    console.log('🧪 Testing Complete Login Flow\n');

    // Step 1: Test admin status
    console.log('1️⃣ Checking admin status...');
    const statusResponse = await axios.get('http://localhost:5000/api/admin/auth/status');
    console.log('Status:', statusResponse.data);
    console.log('');

    // Step 2: Test admin login
    console.log('2️⃣ Testing admin login...');
    const loginResponse = await axios.post('http://localhost:5000/api/admin/auth/login', {
      email: 'vishalpatel581012@gmail.com',
      password: 'admin123'
    });
    console.log('Login Response:', {
      success: loginResponse.data.success,
      token: loginResponse.data.token ? 'Present' : 'Missing',
      user: loginResponse.data.user
    });
    console.log('');

    // Step 3: Test token verification
    console.log('3️⃣ Testing token verification...');
    const token = loginResponse.data.token;
    const verifyResponse = await axios.get('http://localhost:5000/api/admin/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Verify Response:', verifyResponse.data);
    console.log('');

    // Step 4: Test protected route
    console.log('4️⃣ Testing protected route...');
    try {
      const protectedResponse = await axios.get('http://localhost:5000/api/shop', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Protected route access: SUCCESS');
    } catch (error) {
      console.log('Protected route access: FAILED');
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n✅ Login flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLoginFlow();
