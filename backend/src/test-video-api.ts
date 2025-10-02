// Test script for video generation API endpoints
// Run with: npx ts-node src/test-video-api.ts

import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function testVideoAPI() {
  console.log('🧪 Testing Video Generation API...\n');

  try {
    // Test 1: Generate Video
    console.log('1️⃣ Testing POST /api/generate-video');
    const generateResponse = await axios.post(`${BASE_URL}/generate-video`, {
      name: 'John Doe',
      city: 'New York',
      phone: '+1234567890'
    });

    console.log('✅ Generate Video Response:', generateResponse.data);
    const videoId = generateResponse.data.data.videoId;

    // Test 2: Check Video Status
    console.log('\n2️⃣ Testing GET /api/video-status/:id');
    const statusResponse = await axios.get(`${BASE_URL}/video-status/${videoId}`);
    console.log('✅ Video Status Response:', statusResponse.data);

    // Test 3: Get All Videos
    console.log('\n3️⃣ Testing GET /api/videos');
    const videosResponse = await axios.get(`${BASE_URL}/videos`);
    console.log('✅ Videos List Response:', videosResponse.data);

    // Test 4: Health Check
    console.log('\n4️⃣ Testing Health Check');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health Check Response:', healthResponse.data);

    console.log('\n🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ API Test Failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testVideoAPI();
}

export { testVideoAPI };
