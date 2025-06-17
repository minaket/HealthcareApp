const axios = require('axios');

const testBackendConnection = async () => {
  const possibleUrls = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://192.168.0.103:5000',
    'http://192.168.0.1:5000',
    'http://192.168.1.1:5000',
    'http://10.0.0.1:5000'
  ];

  console.log('🔍 Testing backend connection...\n');

  for (const url of possibleUrls) {
    try {
      console.log(`Testing: ${url}`);
      
      // Test health endpoint
      const healthResponse = await axios.get(`${url}/health`, {
        timeout: 3000
      });
      
      console.log(`✅ Health endpoint: ${healthResponse.status} - ${JSON.stringify(healthResponse.data)}`);
      
      // Test API health endpoint
      const apiHealthResponse = await axios.get(`${url}/api/health`, {
        timeout: 3000
      });
      
      console.log(`✅ API health endpoint: ${apiHealthResponse.status} - ${JSON.stringify(apiHealthResponse.data)}`);
      
      console.log(`\n🎉 Backend is accessible at: ${url}\n`);
      return url;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data)}`);
      }
      console.log('');
    }
  }
  
  console.log('❌ No working backend URL found');
  return null;
};

// Run the test
testBackendConnection()
  .then((workingUrl) => {
    if (workingUrl) {
      console.log(`\n💡 Use this URL in your app: ${workingUrl}`);
      console.log('💡 Update your constants.ts file with this URL if needed');
    }
  })
  .catch((error) => {
    console.error('Test failed:', error);
  }); 