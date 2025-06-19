const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test doctor conversations endpoint
async function testDoctorConversations() {
  try {
    console.log('Testing doctor conversations endpoint...');
    
    // First, login to get a fresh token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'neemahealthhospital@gmail.com',
      password: 'Doctor123@'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('Login successful, token received');
    
    // Test doctor conversations
    const conversationsResponse = await axios.get(`${BASE_URL}/api/doctor/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Doctor conversations response:', conversationsResponse.data);
    
  } catch (error) {
    console.error('Error testing doctor conversations:', error.response?.data || error.message);
  }
}

// Test get doctors endpoint
async function testGetDoctors() {
  try {
    console.log('\nTesting get doctors endpoint...');
    
    // First, login to get a fresh token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'minakethi5@gmail.com',
      password: 'Patient123@'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('Login successful, token received');
    
    // Test get doctors
    const doctorsResponse = await axios.get(`${BASE_URL}/api/users/doctors`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Get doctors response:', doctorsResponse.data);
    
  } catch (error) {
    console.error('Error testing get doctors:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await testDoctorConversations();
  await testGetDoctors();
  process.exit(0);
}

runTests(); 